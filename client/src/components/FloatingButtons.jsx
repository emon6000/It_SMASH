import { Facebook, MessageCircle } from 'lucide-react';
import { useApp } from '../context';

export default function FloatingButtons() {
  const { config } = useApp();
  const s = config?.site || {};
  const cls = 'flex h-11 w-11 items-center justify-center rounded-full border border-fg bg-bg text-fg shadow-md transition-transform hover:scale-105';
  if (!s.facebook && !s.whatsapp) return null;
  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-3">
      {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" className={cls} aria-label="Facebook"><Facebook size={19} /></a>}
      {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className={cls} aria-label="WhatsApp"><MessageCircle size={19} /></a>}
    </div>
  );
}
