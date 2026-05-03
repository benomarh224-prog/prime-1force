import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── In-Memory Rate Limiter ───────────────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(options: {
  intervalMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}) {
  const {
    intervalMs = 60 * 1000, // 1 minute default
    maxRequests = 60,
    keyPrefix = 'rl',
  } = options;

  return function checkLimit(request: NextRequest): {
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    // Get client IP from headers (respects proxy)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const key = `${keyPrefix}:${ip}`;

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      const newEntry = { count: 1, resetTime: now + intervalMs };
      rateLimitStore.set(key, newEntry);
      return { success: true, limit: maxRequests, remaining: maxRequests - 1, resetTime: newEntry.resetTime };
    }

    if (entry.count >= maxRequests) {
      return { success: false, limit: maxRequests, remaining: 0, resetTime: entry.resetTime };
    }

    entry.count++;
    return { success: true, limit: maxRequests, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
  };
}

// ─── Security Headers ─────────────────────────────────────────────────
const securityHeaders = new Headers({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
});

// ─── CSRF Protection Token ────────────────────────────────────────────
// Simple double-submit cookie pattern for API routes
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf_token')?.value;
  const headerToken = request.headers.get('x-csrf-token');

  if (!cookieToken || !headerToken) return false;
  // Timing-safe comparison via constant-time check
  try {
    return crypto.subtle.timingSafeEqual(
      new TextEncoder().encode(cookieToken),
      new TextEncoder().encode(headerToken)
    );
  } catch {
    return false;
  }
}

// ─── XSS Sanitization ─────────────────────────────────────────────────
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<\s*img[^>]+onerror\b[^>]*>/gi,
  /<\s*img[^>]+onload\b[^>]*>/gi,
  /<\s*svg[^>]*>.*?<\/\s*svg>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<\s*iframe\b[^>]*>.*?<\/\s*iframe>/gi,
  /<\s*object\b[^>]*>.*?<\/\s*object>/gi,
  /<\s*embed\b[^>]*>/gi,
  /<\s*form\b[^>]*>.*?<\/\s*form>/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*["']?\s*javascript:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
];

export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    let sanitized = input.trim();
    for (const pattern of XSS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item));
  }

  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize object keys too
      let safeKey = key;
      for (const pattern of XSS_PATTERNS) {
        safeKey = safeKey.replace(pattern, '');
      }
      sanitized[safeKey] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

// ─── Middleware ────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip middleware for static files, _next, and favicon ──
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/logo') ||
    pathname.includes('.') // static file extensions
  ) {
    return NextResponse.next();
  }

  // ── Apply rate limiting to API routes ──
  if (pathname.startsWith('/api/')) {
    const limiter = rateLimit({
      intervalMs: 60 * 1000,
      maxRequests: pathname.includes('ai-coach') ? 20 : 60, // Stricter for AI
      keyPrefix: `api:${pathname}`,
    });

    const result = limiter(request);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
          },
        }
      );
    }

    // Set rate limit headers on successful requests
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  }

  // ── Apply security headers to all responses ──
  const response = NextResponse.next();

  // Apply all security headers
  for (const [key, value] of securityHeaders.entries()) {
    response.headers.set(key, value);
  }

  // Content-Security-Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: ws: wss:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "frame-src 'self'",
  ];

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|images/).*)',
  ],
};
