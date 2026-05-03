'use client';

import { useAppStore, type PageName } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Home,
  LayoutDashboard,
  Utensils,
  Mail,
  Menu,
  Moon,
  Sun,
  Bot,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';

const navItems: { label: string; page: PageName; icon: React.ReactNode }[] = [
  { label: 'Home', page: 'home', icon: <Home className="h-4 w-4" /> },
  { label: 'Workouts', page: 'workouts', icon: <Dumbbell className="h-4 w-4" /> },
  { label: 'AI Coach', page: 'ai-coach', icon: <Bot className="h-4 w-4" /> },
  { label: 'Dashboard', page: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Nutrition', page: 'nutrition', icon: <Utensils className="h-4 w-4" /> },
  { label: 'Contact', page: 'contact', icon: <Mail className="h-4 w-4" /> },
];

const emptySubscribe = () => () => {};

export function Header() {
  const { currentPage, navigate } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg group-hover:scale-110 transition-transform">
              P
            </div>
            <span className="text-xl font-bold tracking-tight">
              Prime<span className="text-primary"> Forge</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.page}
                variant={currentPage === item.page ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate(item.page)}
                className={`gap-2 rounded-lg transition-all ${
                  currentPage === item.page
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent'
                }`}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-lg"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button
              onClick={() => navigate('workouts')}
              className="hidden sm:flex gap-2 rounded-lg neon-glow font-semibold"
              size="sm"
            >
              Start Now
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-lg">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                    <span className="text-lg font-bold">
                      Prime<span className="text-primary"> Forge</span>
                    </span>
                  </div>
                  <nav className="flex flex-col p-2 gap-1 flex-1">
                    {navItems.map((item) => (
                      <Button
                        key={item.page}
                        variant={currentPage === item.page ? 'secondary' : 'ghost'}
                        className={`justify-start gap-3 rounded-lg h-12 ${
                          currentPage === item.page
                            ? 'bg-primary/10 text-primary font-medium'
                            : ''
                        }`}
                        onClick={() => navigate(item.page)}
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    ))}
                  </nav>
                  <div className="p-4 border-t space-y-2">
                    <Button
                      onClick={() => navigate('workouts')}
                      className="w-full gap-2 rounded-lg neon-glow font-semibold"
                    >
                      Start Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('ai-coach')}
                      className="w-full gap-2 rounded-lg"
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
  );
}
