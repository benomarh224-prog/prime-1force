'use client';

export type AuthDialogMode = 'login' | 'signup';

export const authDialogEventName = 'primeforge:auth-dialog';

export function openAuthDialog(mode: AuthDialogMode = 'login') {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(authDialogEventName, {
      detail: { mode },
    })
  );
}
