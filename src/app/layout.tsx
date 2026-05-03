import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://primeforge.21-0-10-152.sslip.io";

export const metadata: Metadata = {
  title: {
    default: "Prime Forge - AI-Powered Fitness Platform",
    template: "%s | Prime Forge",
  },
  description: "Transform your body with personalized AI coaching, 500+ exercises, smart tracking, and custom meal plans. Your complete fitness companion.",
  keywords: ["fitness", "workout", "AI coach", "gym", "nutrition", "training", "health", "exercise", "meal plans", "progress tracking", "prime forge"],
  authors: [{ name: "Prime Forge Team", url: SITE_URL }],
  creator: "Prime Forge",
  publisher: "Prime Forge",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Prime Forge - AI-Powered Fitness Platform",
    description: "Transform your body with personalized AI coaching, 500+ exercises, smart tracking, and custom meal plans.",
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Prime Forge",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Forge - AI-Powered Fitness Platform",
    description: "Transform your body with personalized AI coaching, 500+ exercises, smart tracking, and custom meal plans.",
    creator: "@primeforge",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
