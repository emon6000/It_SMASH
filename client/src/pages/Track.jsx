import { useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../context';
import { useTitle } from '../lib/useTitle';
import { api, imgUrl, money } from '../lib/api';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function Track() {
  const { t } = useApp();
  useTitle(t('trackTitle'));
  const [no, setNo] = useState('');
  const [phone, setPhone] = useState('');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const fmt = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setRes(null); setBusy(true);
    try { setRes(await api('/track', { method: 'POST', body: { orderNumber: no, phone } })); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const idx = res ? STEPS.indexOf(res.status) : -1;
  const dead = res && (res.status === 'cancelled' || res.status === 'returned');

  return (
    <div className="container-x max-w-2xl py-14">
      <h1 className="font-display text-4xl sm:text-5xl">{t('trackTitle')}</h1>
      <p className="mt-3 text-sm text-muted">{t('trackSub')}</p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-[28px] border border-line bg-bg/80 p-5 shadow-[0_18px_45px_rgba(0,0,0,0.06)]">
        <div><label className="label">{t('orderNo')}</label><input className="input border border-accent/40 bg-bg/90 font-mono uppercase shadow-inner" required placeholder="MS-261024-ABCD" value={no} onChange={(e) => setNo(e.target.value)} /></div>
        <div><label className="label">{t('phone')}</label><input className="input border border-accent/40 bg-bg/90 shadow-inner" required inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        {err && <p className="text-sm text-accent">{err}</p>}
        <button className="btn w-full !rounded-2xl !py-3.5" disabled={busy}>{busy ? t('tracking') : t('trackBtn')}</button>
      </form>

      {res && (
        <div className="mt-10 border border-line p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="kicker">{t('orderNo')}</div><div className="font-mono text-xl">{res.orderNumber}</div></div>
            <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-widest ${dead ? 'bg-accent text-white' : 'bg-fg text-bg'}`}>{t(`st_${res.status}`)}</span>
          </div>
          {!dead && (
            <ol className="mt-8 flex items-start justify-between">
              {STEPS.map((s, n) => (
                <li key={s} className="relative flex flex-1 flex-col items-center text-center">
                  {n > 0 && <span className={`absolute right-1/2 top-3.5 h-px w-full ${n <= idx ? 'bg-fg' : 'bg-line'}`} />}
                  <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs ${n <= idx ? 'border-fg bg-fg text-bg' : 'border-line bg-bg text-muted'}`}>{n <= idx ? <Check size={14} /> : n + 1}</span>
                  <span className={`mt-2 text-[10px] uppercase leading-tight tracking-wider ${n <= idx ? 'text-fg' : 'text-muted'}`}>{t(`st_${s}`)}</span>
                </li>
              ))}
            </ol>
          )}
          {res.courierNote && <div className="mt-6 bg-soft p-4 text-sm"><div className="kicker mb-1">{t('courierInfo')}</div>{res.courierNote}</div>}
          <div className="mt-6">
            <div className="kicker mb-2">{t('orderItems')}</div>
            {res.items.map((i, n) => (
              <div key={n} className="flex items-center gap-3 border-t border-line py-3 text-sm">
                <div className="h-14 w-12 shrink-0 bg-soft">{i.image && <img src={imgUrl(i.image)} alt="" className="h-full w-full object-cover" />}</div>
                <div className="flex-1"><div>{i.name} × {i.qty}</div><div className="text-xs text-muted">{Object.entries(i.options || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div></div>
                <div>{money(i.price * i.qty)}</div>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-3 font-semibold"><span>{t('total')}</span><span>{money(res.total)}</span></div>
          </div>
          <div className="mt-6 space-y-2 border-t border-line pt-5">
            {res.history.map((h, n) => (
              <div key={n} className="flex justify-between gap-3 text-xs"><span><b>{t(`st_${h.status}`)}</b>{h.note ? ` — ${h.note}` : ''}</span><span className="shrink-0 text-muted">{fmt(h.created_at)}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
