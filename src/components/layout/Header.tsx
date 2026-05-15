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
  LayoutDashboard,
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
  { label: 'Dashboard', page: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
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
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Member';

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
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('home')}
            className={`flex min-w-0 items-center gap-3 group ${heroTop ? 'text-white' : ''}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105">
              <Image src="/logo.svg" alt="Prime Forge" width={36} height={36} className="rounded-lg" />
            </span>
            <span className={`truncate text-lg sm:text-xl font-black uppercase tracking-tight ${heroTop ? 'text-white' : ''}`}>
              Prime<span className={heroTop ? 'text-white' : 'text-primary'}> Forge</span>
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
                  <span className="truncate">{userName}</span>
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
                <Button variant="ghost" size="icon" className={`lg:hidden rounded-lg ${heroTop ? 'text-white hover:bg-white/10 hover:text-white' : ''}`}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(92vw,20rem)] p-0 luxury-surface">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex min-h-full flex-col">
                  <div className="flex shrink-0 items-center justify-between border-b p-4">
                    <span className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
                      <Image src="/logo.svg" alt="Prime Forge" width={36} height={36} className="rounded-lg" />
                      Prime<span className="text-primary"> Forge</span>
                    </span>
                  </div>
                  <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.page}
                        variant={currentPage === item.page ? 'secondary' : 'ghost'}
                        className={`justify-start gap-3 rounded-lg h-12 ${
                          currentPage === item.page
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground'
                        }`}
                        onClick={() => navigateFromMobile(item.page)}
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    ))}
                  </nav>
                  <div className="shrink-0 space-y-2 border-t p-4">
                    {status === 'authenticated' ? (
                      <>
                        <Button
                          onClick={() => navigateFromMobile('dashboard')}
                          className="w-full gap-2 rounded-lg neon-glow font-semibold"
                        >
                          <UserCircle className="h-4 w-4" />
                          <span className="truncate">{userName}</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            signOut({ redirect: false });
                          }}
                          className="w-full gap-2 rounded-lg border-primary/20"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => openAuthFromMobile('signup')}
                          className="w-full gap-2 rounded-lg neon-glow font-semibold"
                        >
                          Sign Up
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openAuthFromMobile('login')}
                          className="w-full gap-2 rounded-lg border-primary/20"
                        >
                          <UserCircle className="h-4 w-4" />
                          Login
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => navigateFromMobile('ai-coach')}
                      className="w-full gap-2 rounded-lg border-primary/20"
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
