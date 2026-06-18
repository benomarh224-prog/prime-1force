'use client';

import Image from 'next/image';
import { useAppStore, type PageName } from '@/lib/store';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { authDialogEventName, type AuthDialogMode } from '@/lib/auth-dialog';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Home,
  Utensils,
  Mail,
  Menu,
  Bot,
  ArrowRight,
  CalendarDays,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const navItems: { label: string; page: PageName; icon: React.ReactNode }[] = [
  { label: 'Home', page: 'home', icon: <Home className="h-4 w-4" /> },
  { label: 'Workouts', page: 'workouts', icon: <Dumbbell className="h-4 w-4" /> },
  { label: 'Schedule', page: 'schedule', icon: <CalendarDays className="h-4 w-4" /> },
  { label: 'AI Coach', page: 'ai-coach', icon: <Bot className="h-4 w-4" /> },
  { label: 'Nutrition', page: 'nutrition', icon: <Utensils className="h-4 w-4" /> },
  { label: 'Contact', page: 'contact', icon: <Mail className="h-4 w-4" /> },
];

export function Header() {
  const { currentPage, navigate } = useAppStore();
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const heroTop = currentPage === 'home' && !scrolled;

  const openAuth = (mode: AuthDialogMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const navigateFromMobile = (page: PageName) => {
    navigate(page);
    setMobileMenuOpen(false);
  };

  const openAuthFromMobile = (mode: AuthDialogMode) => {
    setMobileMenuOpen(false);
    openAuth(mode);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleAuthDialog = (event: Event) => {
      const mode = (event as CustomEvent<{ mode?: AuthDialogMode }>).detail?.mode || 'login';
      openAuth(mode);
    };

    window.addEventListener(authDialogEventName, handleAuthDialog);
    return () => window.removeEventListener(authDialogEventName, handleAuthDialog);
  }, []);

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          heroTop
            ? 'bg-transparent'
            : scrolled
            ? 'glass shadow-[0_16px_42px_oklch(0_0_0_/_0.24)]'
            : 'glass'
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
          <div className="flex h-14 items-center justify-between sm:h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('home')}
            className="group flex min-w-0 items-center"
            aria-label="Prime Forge home"
          >
            <span className="block shrink-0 transition-transform group-hover:scale-[1.02]">
              <Image src="/logo-wordmark.png" alt="Prime Forge" width={182} height={28} className="h-6 w-auto sm:h-8" priority />
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.page}
                variant={currentPage === item.page ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate(item.page)}
                className={`gap-2 rounded-lg transition-all ${
                  heroTop
                    ? 'bg-transparent text-white/90 hover:bg-white/10 hover:text-white uppercase font-bold'
                    : currentPage === item.page
                    ? 'bg-primary/10 text-primary font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span className={heroTop ? 'hidden' : ''}>{item.icon}</span>
                {item.page === 'workouts' && heroTop ? 'Programs' : item.label}
              </Button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {status === 'authenticated' ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('dashboard')}
                  className={`max-w-44 gap-2 rounded-lg ${
                    heroTop ? 'border-white/25 bg-black/20 text-white hover:bg-white/10 hover:text-white' : ''
                  }`}
                >
                  <UserCircle className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ redirect: false })}
                  className={`rounded-lg ${heroTop ? 'text-white hover:bg-white/10 hover:text-white' : ''}`}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  onClick={() => openAuth('login')}
                  variant="ghost"
                  className={`rounded-lg font-semibold ${
                    heroTop ? 'text-white hover:bg-white/10 hover:text-white' : ''
                  }`}
                  size="sm"
                >
                  Login
                </Button>
                <Button
                  onClick={() => openAuth('signup')}
                  variant={heroTop ? 'outline' : 'default'}
                  className={`gap-2 font-semibold ${
                    heroTop
                      ? 'h-11 rounded-lg border-primary/70 bg-black/20 px-6 uppercase text-white shadow-none hover:bg-primary hover:text-primary-foreground'
                      : 'rounded-lg neon-glow'
                  }`}
                  size="sm"
                >
                  Sign Up
                  <ArrowRight className={`h-4 w-4 ${heroTop ? 'hidden' : ''}`} />
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-11 w-11 rounded-lg lg:hidden ${
                    heroTop
                      ? 'bg-black/20 text-white ring-1 ring-white/10 hover:bg-white/10 hover:text-white'
                      : 'bg-card/55 ring-1 ring-primary/10'
                  }`}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="right-2 top-2 bottom-2 h-auto w-[min(calc(100vw-1rem),22rem)] overflow-hidden rounded-2xl border border-cyan-200/15 bg-[#071019]/[0.98] p-0 shadow-[0_24px_80px_rgba(0,0,0,0.62),0_0_36px_rgba(0,194,255,0.10)] backdrop-blur-2xl sm:right-3 sm:top-3 sm:bottom-3"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex min-h-full flex-col">
                  <div className="relative shrink-0 border-b border-white/10 px-4 py-4 pr-12">
                    <span className="block">
                      <Image src="/logo-wordmark.png" alt="Prime Forge" width={182} height={28} className="h-6 w-auto" />
                    </span>
                    <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/42">
                      Training cockpit
                    </p>
                  </div>
                  <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                    {navItems.map((item) => (
                      <button
                        type="button"
                        key={item.page}
                        className={`group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.94rem] font-bold transition-all ${
                          currentPage === item.page
                            ? 'border border-cyan-200/20 bg-cyan-200/12 text-cyan-100 shadow-[0_0_24px_rgba(0,194,255,0.08)]'
                            : 'border border-transparent text-white/62 hover:border-white/10 hover:bg-white/[0.055] hover:text-white'
                        }`}
                        onClick={() => navigateFromMobile(item.page)}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            currentPage === item.page ? 'bg-cyan-200/10 text-cyan-100' : 'bg-white/[0.045] text-white/48 group-hover:text-white'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="min-w-0 truncate">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="shrink-0 space-y-2 border-t border-white/10 bg-black/20 p-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
                    {status === 'authenticated' ? (
                      <>
                        <Button
                          onClick={() => navigateFromMobile('dashboard')}
                          className="h-11 w-full gap-2 rounded-xl bg-cyan-400 text-black font-black shadow-[0_0_28px_rgba(0,194,255,0.24)] hover:bg-cyan-300"
                        >
                          <UserCircle className="h-4 w-4" />
                          Dashboard
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            signOut({ redirect: false });
                          }}
                          className="h-11 w-full gap-2 rounded-xl border-white/10 bg-white/[0.035] text-white hover:bg-white/[0.07] hover:text-white"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => openAuthFromMobile('signup')}
                          className="h-11 w-full gap-2 rounded-xl bg-cyan-400 text-black font-black shadow-[0_0_28px_rgba(0,194,255,0.24)] hover:bg-cyan-300"
                        >
                          Sign Up
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openAuthFromMobile('login')}
                          className="h-11 w-full gap-2 rounded-xl border-white/10 bg-white/[0.035] text-white hover:bg-white/[0.07] hover:text-white"
                        >
                          <UserCircle className="h-4 w-4" />
                          Login
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => navigateFromMobile('ai-coach')}
                      className="h-11 w-full gap-2 rounded-xl border-cyan-200/15 bg-transparent text-white hover:bg-cyan-200/10 hover:text-cyan-50"
                    >
                      <Bot className="h-4 w-4" />
                      Talk to AI Coach
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      </motion.header>
      <AuthDialog open={authOpen} defaultMode={authMode} onOpenChange={setAuthOpen} />
    </>
  );
}
