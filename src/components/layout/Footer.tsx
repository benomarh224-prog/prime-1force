'use client';

import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Heart, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const { navigate } = useAppStore();

  return (
    <footer className="mt-auto border-t border-primary/10 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">Get in touch</h3>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Questions, feedback, or a training feature you want to see? Send a message directly through Prime Forge.
            </p>
            <Button onClick={() => navigate('contact')} variant="outline" className="mt-5 rounded-lg border-primary/20">
              <Mail className="h-4 w-4" />
              Contact Prime Forge
              <ArrowRight className="h-4 w-4" />
            </Button>
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
