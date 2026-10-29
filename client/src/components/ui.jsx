import { Link } from 'react-router-dom';
import { useApp } from '../context';

export function SectionHead({ kicker, title, to, linkText }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker && <div className="kicker mb-2">{kicker}</div>}
        <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
      </div>
      {to && <Link to={to} className="shrink-0 whitespace-nowrap rounded-full border border-line bg-soft px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-fg hover:border-accent/50 hover:text-accent">{linkText} →</Link>}
    </div>
  );
}

export function Spinner() {
  return <div className="flex justify-center py-16"><div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-fg" /></div>;
}

export function ErrorBox({ onRetry }) {
  const { t } = useApp();
  return (
    <div className="py-16 text-center">
      <p className="mb-4 text-muted">{t('loadError')}</p>
      {onRetry && <button className="btn-outline" onClick={onRetry}>{t('retry')}</button>}
    </div>
  );
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 bg-fg px-5 py-3 text-sm text-bg shadow-lg">{toast}</div>;
}

export function Grid({ children }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}
