import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Info } from 'lucide-react';
import { useApp } from '../context';
import { useTitle } from '../lib/useTitle';
import { api, money } from '../lib/api';
import { calcTotals, DISTRICTS } from '../lib/pricing';
import { CartLine, Progress } from '../components/CartDrawer';
import { Logo } from '../components/Header';

export default function Checkout() {
  const { t, cart, config, clearCart, showToast } = useApp();
  const nav = useNavigate();
  useTitle(t('checkout'));
  const [f, setF] = useState({ name: '', phone: '', email: '', district: 'Dhaka', address: '', notes: '', trxId: '' });
  const [pay, setPay] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const tot = calcTotals(cart, config, f.district, pay);
  const bkash = config?.site?.bkash;
  const freeBkash = config?.shipping?.freeWithBkash;

  if (!cart.length) return (
    <div className="container-x flex flex-col items-center gap-4 py-24 text-center"><p className="text-muted">{t('emptyBag')}</p><Link to="/products" className="btn-outline">{t('continueShopping')}</Link></div>
  );

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (f.name.trim().length < 2) return setErr(t('fullName') + ' ?');
    if (!/^[+\d\s-]{10,16}$/.test(f.phone.trim())) return setErr(t('phone') + ' ?');
    if (f.address.trim().length < 8) return setErr(t('address') + ' ?');
    setBusy(true);
    try {
      const res = await api('/orders', { method: 'POST', body: {
        name: f.name, phone: f.phone, email: f.email, district: f.district, address: f.address, notes: f.notes,
        paymentMethod: pay, trxId: pay === 'bkash' ? f.trxId : '',
        items: cart.map((i) => ({ productId: i.productId, qty: i.qty, options: i.options })) } });
      clearCart();
      nav('/order-success', { replace: true, state: { ...res, phone: f.phone } });
    } catch (ex) { setErr(ex.message); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setBusy(false); }
  };
  const radio = (on) => `flex cursor-pointer items-start gap-3 border p-4 ${on ? 'border-fg bg-soft' : 'border-line'}`;
  const copy = () => { navigator.clipboard?.writeText(bkash.replace(/\D/g, '')); showToast(t('copied')); };

  return (
    <div className="container-x py-8">
      <div className="mb-8 flex items-center justify-between"><Link to="/products" className="text-[11px] uppercase tracking-[0.2em] text-muted hover:text-fg">‹ {t('continueShopping')}</Link><Logo className="text-sm" /></div>
      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-10">
          {err && <div className="border border-accent bg-accent/10 px-4 py-3 text-sm text-accent">{err}</div>}
          <section>
            <h2 className="mb-5 text-xl font-semibold">{t('deliveryDetails')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">{t('fullName')} *</label><input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></div>
              <div><label className="label">{t('phone')} *</label><input className="input" required inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>
              <div><label className="label">{t('email')} ({t('optional')})</label><input className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></div>
              <div><label className="label">{t('district')} *</label>
                <select className="input" value={f.district} onChange={set('district')}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div className="sm:col-span-2"><label className="label">{t('address')} *</label><textarea className="input min-h-24" required placeholder={t('addressPh')} value={f.address} onChange={set('address')} autoComplete="street-address" /></div>
              <div className="sm:col-span-2"><label className="label">{t('notes')} ({t('optional')})</label><textarea className="input" placeholder={t('notesPh')} value={f.notes} onChange={set('notes')} /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-green-500/10 px-4 py-3 text-xs text-green-700 dark:text-green-400"><Info size={15} />{t('callConfirm')}</div>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold">{t('shippingMethod')}</h2>
            <div className={radio(true)}><input type="radio" checked readOnly className="mt-1 accent-black dark:accent-white" />
              <div className="flex-1"><div className="text-sm font-medium">{t('standard')}</div><div className="text-xs text-muted">{f.district === 'Dhaka' ? t('deliveryInfo').split(' · ')[0] : t('deliveryInfo').split(' · ')[1]}</div></div>
              <div className="text-sm">{tot.shipping ? money(tot.shipping) : t('free')}</div></div>
          </section>

          <section>
            <h2 className="mb-5 text-xl font-semibold">{t('payment')}</h2>
            <div className="space-y-3">
              {bkash && (
                <label className={radio(pay === 'bkash')}><input type="radio" name="pay" checked={pay === 'bkash'} onChange={() => setPay('bkash')} className="mt-1 accent-black dark:accent-white" />
                  <div className="flex-1"><div className="text-sm font-medium">{t('bkash')} {freeBkash && <span className="ml-1 bg-fg px-1.5 py-0.5 text-[9px] text-bg">{t('freeDelivery')}</span>}</div><div className="text-xs text-muted">{t('bkashSub')}</div></div></label>
              )}
              {pay === 'bkash' && bkash && (
                <div className="space-y-3 border border-accent/40 bg-accent/5 p-4">
                  <div className="text-[11px] text-accent">{t('bkashPersonal')}</div>
                  <div className="flex items-center justify-between gap-3"><span className="font-mono text-xl">{bkash}</span><button type="button" className="btn !px-4 !py-2.5" onClick={copy}><Copy size={14} />{t('copyNumber')}</button></div>
                  <div><label className="label">{t('trxId')} ({t('optional')})</label><input className="input font-mono" value={f.trxId} onChange={set('trxId')} placeholder="9H72K9… / 017XXXXXXXX" /></div>
                  <p className="text-xs text-muted">{t('payingLater')}</p>
                </div>
              )}
              <label className={radio(pay === 'cod')}><input type="radio" name="pay" checked={pay === 'cod'} onChange={() => setPay('cod')} className="mt-1 accent-black dark:accent-white" />
                <div className="flex-1"><div className="text-sm font-medium">{t('cod')}</div><div className="text-xs text-muted">{t('codSub')}</div></div></label>
            </div>
          </section>
        </div>

        <aside className="h-fit border border-line bg-soft p-6 lg:sticky lg:top-24">
          <h2 className="mb-1 text-lg font-semibold">{t('orderSummary')}</h2>
          <div className="mb-3"><Progress cfg={config} tot={tot} t={t} /></div>
          <div>{cart.map((i) => <CartLine key={i.key} i={i} />)}</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t('subtotal')}</span><span>{money(tot.subtotal)}</span></div>
            {tot.discount > 0 && <div className="flex justify-between text-accent"><span>{t('discount')} ({tot.tier.percent}%)</span><span>-{money(tot.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted">{t('delivery')} ({f.district})</span><span>{tot.shipping ? money(tot.shipping) : t('free')}</span></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><span>{t('total')}</span><span>{money(tot.total)}</span></div>
          </div>
          <button className="btn mt-5 w-full" disabled={busy}>{busy ? t('placing') : `${t('placeOrder')} · ${money(tot.total)}`}</button>
          <p className="mt-3 text-center text-[11px] text-muted">{t('terms')}</p>
        </aside>
      </form>
    </div>
  );
}
