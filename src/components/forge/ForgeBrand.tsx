export function ForgeBrand({ compact = false }: { compact?: boolean }) {
  return <span className="forge-brand"><svg className="forge-brand-icon" viewBox="0 0 36 40" aria-hidden="true"><path d="M3 2h30L18 13 3 2Zm0 5 12 9v7l-7-5v10l-5-4V7Zm30 0v17l-5 4V18l-7 5v-7L33 7ZM16 18h4v20l-4-3V18Z" fill="currentColor" /></svg>{!compact && <span>PRIME FORGE</span>}</span>;
}
