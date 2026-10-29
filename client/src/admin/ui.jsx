import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { STATUS_COLOR } from './api';
import { notify } from './api';

export const Badge = ({ status }) => <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLOR[status] || 'bg-soft'}`}>{status}</span>;
export const Card = ({ title, action, children, className = '' }) => (
  <section className={`border border-line bg-bg p-5 ${className}`}>
    {(title || action) && <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>{action}</div>}
    {children}
  </section>
);
export const Field = ({ label, hint, children, className = '' }) => (
  <div className={className}><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}</div>
);
export const Th = ({ children, className = '' }) => <th className={`whitespace-nowrap px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted ${className}`}>{children}</th>;
export const Td = ({ children, className = '' }) => <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
export const Loading = () => <div className="py-16 text-center text-sm text-muted">Loading…</div>;
export const Err = ({ msg, retry }) => <div className="py-10 text-center text-sm text-accent">{msg} {retry && <button className="ml-2 underline" onClick={retry}>Retry</button>}</div>;

export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-green-600' : 'bg-line'}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  notify('Copied');
}

export function CopyBox({ title, text, extra }) {
  const [done, setDone] = useState(false);
  const copy = async () => { await copyText(text); setDone(true); setTimeout(() => setDone(false), 1500); };
  return (
    <div className="border border-line">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-soft px-3 py-2">
        <span className="text-xs font-semibold">{title}</span>
        <div className="flex items-center gap-2">{extra}<button onClick={copy} className="btn !px-3 !py-1.5 !text-[10px]">{done ? <Check size={12} /> : <Copy size={12} />}{done ? 'Copied' : 'Copy'}</button></div>
      </div>
      <textarea readOnly value={text} rows={8} className="block w-full resize-y bg-bg p-3 font-mono text-xs outline-none" onFocus={(e) => e.target.select()} />
    </div>
  );
}

export const confirmDo = (msg) => window.confirm(msg);
