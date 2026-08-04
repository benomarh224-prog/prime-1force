import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/components/providers/AppProviders";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://primeforge.21-0-10-152.sslip.io";

export const metadata: Metadata = {
  title: {
    default: "Prime Forge - Forge Your Best Self",
    template: "%s | Prime Forge",
  },
  description: "Build discipline, master your habits, strengthen your mindset, improve your health, and achieve meaningful goals with your personal growth operating system.",
  keywords: ["self improvement", "habit tracker", "goal setting", "focus timer", "AI coach", "productivity", "mindset", "journal", "learning", "fitness", "personal growth", "prime forge"],
  authors: [{ name: "Prime Forge Team", url: SITE_URL }],
  creator: "Prime Forge",
  publisher: "Prime Forge",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
  openGraph: {
    title: "Prime Forge - Forge Your Best Self",
    description: "Build discipline, master your habits, strengthen your mindset, improve your health, and achieve meaningful goals with your personal growth operating system.",
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Prime Forge",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prime Forge strength training",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Forge - Forge Your Best Self",
    description: "Build discipline, master your habits, strengthen your mindset, improve your health, and achieve meaningful goals with your personal growth operating system.",
    images: ["/opengraph-image.jpg"],
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
        className="antialiased bg-background text-foreground"
      >
        <AppProviders>
          <ScrollToTop />
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
