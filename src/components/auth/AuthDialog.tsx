'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Apple, AtSign, Chrome, KeyRound, Loader2, Lock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthDialogProps {
  open: boolean;
  defaultMode?: AuthMode;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, defaultMode = 'login', onOpenChange }: AuthDialogProps) {
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialProviders, setSocialProviders] = useState({ google: false, apple: false });

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setError('');
      setSuccess('');
    }
  }, [defaultMode, open]);

  useEffect(() => {
    if (!open) return;

    getProviders()
      .then((providers) => {
        setSocialProviders({
          google: Boolean(providers?.google),
          apple: Boolean(providers?.apple),
        });
      })
      .catch(() => setSocialProviders({ google: false, apple: false }));
  }, [open]);

  const resetFeedback = () => {
    setError('');
    setSuccess('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setError('');
      setSuccess('');
      setPassword('');
    }
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Could not start password reset');
        }

        setSuccess(data.message || 'Password reset instructions have been sent.');
        setPassword('');
        return;
      }

      if (mode === 'signup') {
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const registerData = await registerResponse.json();

        if (!registerResponse.ok || !registerData.success) {
          throw new Error(registerData.error || 'Could not create your account');
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (name.trim()) {
        setUserProfile({ name: name.trim() });
      }

      setPassword('');
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setError('');
    setSuccess('');

    if (!socialProviders[provider]) {
      setError(`${provider === 'google' ? 'Google' : 'Apple'} sign-in is ready in the UI but needs provider credentials in the environment.`);
      return;
    }

    await signIn(provider, { callbackUrl: '/' });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-primary/15 bg-background/95 p-0 shadow-[0_24px_80px_oklch(0_0_0_/_0.45)] backdrop-blur-xl sm:max-w-md">
        <div className="border-b border-primary/10 px-5 pb-4 pt-5">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {mode === 'forgot' ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Create your account'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'forgot'
                ? 'Enter your email and we will send reset instructions if the account exists.'
                : mode === 'login'
                  ? 'Sign in to keep your training plan and progress together.'
                  : 'Start saving your workouts, schedule, and coaching history.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5">
          <div className="mb-5 grid grid-cols-2 rounded-lg border border-primary/10 bg-card/55 p-1">
            {(['login', 'signup'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleModeChange(item)}
                className={cn(
                  'h-10 rounded-md text-sm font-semibold transition-colors',
                  mode === item ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item === 'login' ? 'Login' : 'Sign up'}
              </button>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignIn('google')}
              className="h-11 rounded-lg gap-2"
            >
              <Chrome className="h-4 w-4" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignIn('apple')}
              className="h-11 rounded-lg gap-2"
            >
              <Apple className="h-4 w-4" />
              Apple
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="auth-name">Name</Label>
                <Input
                  id="auth-name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="h-11"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-11 pl-9"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="auth-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === 'login' ? 'Your password' : '8+ chars, uppercase, number'}
                    className="h-11 pl-9"
                    required
                  />
                </div>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot')}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
                {success}
              </p>
            )}

            <Button type="submit" className="h-11 w-full rounded-lg font-bold neon-glow" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'forgot' ? (
                <>
                  <KeyRound className="h-4 w-4" />
                  Send reset instructions
                </>
              ) : mode === 'login' ? 'Login' : 'Create account'}
            </Button>
          </form>

          {mode === 'forgot' && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleModeChange('login')}
              className="mt-3 h-10 w-full rounded-lg text-muted-foreground"
            >
              Back to login
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
