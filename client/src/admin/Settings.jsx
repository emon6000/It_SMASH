import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { adm, notify, useAdm } from './api';
import { Card, Err, Field, Loading, Toggle } from './ui';

export default function Settings() {
  const { data, loading, error, reload } = useAdm('/settings');
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS({ shipping: { insideDhaka: 70, outsideDhaka: 130, freeThreshold: 0, freeWithBkash: false, ...data.shipping }, tiers: (data.discount_tiers || []).map((t) => ({ ...t })) }); }, [data]);
  if (error) return <Err msg={error} retry={reload} />;
  if (loading || !s) return <Loading />;
  const sh = (k, v) => setS({ ...s, shipping: { ...s.shipping, [k]: v } });
  const tier = (i, k, v) => setS({ ...s, tiers: s.tiers.map((t, n) => (n === i ? { ...t, [k]: v } : t)) });
  const save = async () => {
    setBusy(true);
    try { await adm('/settings', { method: 'PUT', body: { shipping: s.shipping, discount_tiers: s.tiers } }); notify('Settings saved'); reload(); }
    catch (e) { notify(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card title="Delivery charges">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Inside Dhaka (৳)"><input className="input" type="number" min="0" value={s.shipping.insideDhaka} onChange={(e) => sh('insideDhaka', e.target.value)} /></Field>
          <Field label="Outside Dhaka (৳)"><input className="input" type="number" min="0" value={s.shipping.outsideDhaka} onChange={(e) => sh('outsideDhaka', e.target.value)} /></Field>
          <Field label="Free delivery above (৳)" hint="Order total after discount. 0 = never free."><input className="input" type="number" min="0" value={s.shipping.freeThreshold} onChange={(e) => sh('freeThreshold', e.target.value)} /></Field>
          <label className="flex items-center justify-between gap-3 self-end pb-2 text-sm">Free delivery when paying by bKash<Toggle on={!!s.shipping.freeWithBkash} onChange={(v) => sh('freeWithBkash', v)} label="Free with bKash" /></label>
        </div>
      </Card>
      <Card title="Buy more, save more" action={<button className="flex items-center gap-1 text-xs underline" onClick={() => setS({ ...s, tiers: [...s.tiers, { minQty: (s.tiers.at(-1)?.minQty || 1) + 1, percent: 5 }] })}><Plus size={13} />Add tier</button>}>
        <p className="mb-3 text-xs text-muted">Discount % based on the total number of pieces in the order (any products mixed). Leave empty to turn off.</p>
        <div className="space-y-2">
          {s.tiers.map((t, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-muted">From</span><input className="input !w-20" type="number" min="1" value={t.minQty} onChange={(e) => tier(i, 'minQty', e.target.value)} />
              <span className="text-muted">pieces →</span><input className="input !w-20" type="number" min="1" max="90" value={t.percent} onChange={(e) => tier(i, 'percent', e.target.value)} /><span className="text-muted">% off</span>
              <button aria-label="Remove tier" onClick={() => setS({ ...s, tiers: s.tiers.filter((_, n) => n !== i) })} className="ml-auto text-muted hover:text-accent"><X size={16} /></button>
            </div>
          ))}
          {!s.tiers.length && <p className="text-sm text-muted">No discount tiers.</p>}
        </div>
      </Card>
      <button className="btn" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
      <Card title="Contact numbers & links"><p className="text-sm text-muted">WhatsApp number, Facebook link, phone and bKash number are set in <code className="bg-soft px-1">server/.env</code>. Edit that file and restart the API to change them.</p></Card>
    </div>
  );
}
