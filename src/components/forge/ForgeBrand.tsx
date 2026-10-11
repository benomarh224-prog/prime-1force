export function ForgeBrand({ compact = false }: { compact?: boolean }) {
  return <span className="forge-brand"><svg className="forge-brand-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 27 16 5h10l-4 8h-6l-6 14zM17 19h8l-4 8h-8z" fill="currentColor" /></svg>{!compact && <span>PRIMEFORGE<small>.FIT</small></span>}</span>;
}
