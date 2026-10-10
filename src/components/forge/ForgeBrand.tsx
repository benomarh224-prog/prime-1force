import { Flame } from 'lucide-react';

export function ForgeBrand({ compact = false }: { compact?: boolean }) {
  return <span className="forge-brand"><span className="forge-brand-icon"><Flame size={20} strokeWidth={1.8} /></span>{!compact && <span>prime<span className="forge-brand-light">forge</span><span className="forge-brand-dot">.</span><small>FIT</small></span>}</span>;
}
