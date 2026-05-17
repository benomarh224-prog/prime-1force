'use client';

import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { Separator } from '@/components/ui/separator';
import { Facebook, Twitter, Instagram, Heart } from 'lucide-react';

export function Footer() {
  const { navigate } = useAppStore();

  return (
    <footer className="mt-auto border-t border-primary/10 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <button
              onClick={() => navigate('home')}
              className="mb-4 block"
              aria-label="Prime Forge home"
            >
              <Image src="/logo-wordmark.png" alt="Prime Forge" width={208} height={32} className="h-8 w-auto" />
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered fitness platform that adapts to your goals. Train smarter, not harder.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Platform</h3>
            <ul className="space-y-2">
              {[
                { label: 'Workouts', page: 'workouts' as const },
                { label: 'AI Coach', page: 'ai-coach' as const },
                { label: 'Dashboard', page: 'dashboard' as const },
                { label: 'Nutrition', page: 'nutrition' as const },
              ].map((item) => (
                <li key={item.page}>
                  <button
                    onClick={() => navigate(item.page)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Company</h3>
            <ul className="space-y-2">
              {['About Us', 'Careers', 'Blog', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <button
                    onClick={() => navigate('contact')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Connect</h3>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: 'https://www.instagram.com/elliot_alderson112?igsh=MTdsc21jaG90dWl5OA%3D%3D&utm_source=qr', label: 'Instagram' },
                { Icon: Facebook, href: 'https://www.facebook.com/share/1JQCj2ChYT/?mibextid=wwXIfr', label: 'Facebook' },
                { Icon: Twitter, href: 'https://x.com/ho50539?s=21', label: 'X' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/15 bg-card/60 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <p className="mt-4 break-words text-sm text-muted-foreground">
              houssambenomar17@gmail.com
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} Prime Forge. All rights reserved.</p>
          <p className="flex items-center gap-1 text-center">
            Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for fitness enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
}
