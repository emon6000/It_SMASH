import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useApp } from '../context';
import { imgUrl, money } from '../lib/api';
import { calcTotals } from '../lib/pricing';

export function Progress({ cfg, tot, t }) {
  if (!tot.qty) return null;
  return (
    <div className="space-y-1 text-xs">
      {tot.nextTier && <p className="text-muted">{t('addMore', { n: tot.nextTier.minQty - tot.qty, p: tot.nextTier.percent })}</p>}
      {cfg?.shipping?.freeThreshold ? <p className="text-muted">{tot.toFree > 0 ? t('addForFree', { a: money(tot.toFree) }) : t('freeShipUnlocked')}</p> : null}
    </div>
  );
}

export function CartLine({ i, compact }) {
  const { L, setQty, removeItem } = useApp();
  const opts = Object.entries(i.options || {}).map(([k, v]) => `${k}: ${v}`).join(' · ');
  return (
    <div className="flex gap-3 border-b border-line py-4">
      <Link to={`/product/${i.slug}`} className="block h-20 w-16 shrink-0 bg-soft">{i.image && <img src={imgUrl(i.image)} alt="" className="h-full w-full object-cover" />}</Link>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <Link to={`/product/${i.slug}`} className="line-clamp-2 text-sm">{L(i, 'name')}</Link>
          <button onClick={() => removeItem(i.key)} aria-label="remove" className="text-muted hover:text-fg"><X size={15} /></button>
        </div>
        {opts && <p className="mt-0.5 text-xs text-muted">{opts}</p>}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center border border-line">
            <button className="px-2 py-1" onClick={() => setQty(i.key, i.qty - 1)} aria-label="-"><Minus size={13} /></button>
            <span className="w-7 text-center text-xs">{i.qty}</span>
            <button className="px-2 py-1" onClick={() => setQty(i.key, i.qty + 1)} aria-label="+"><Plus size={13} /></button>
          </div>
          <span className="text-sm font-semibold">{money(i.price * i.qty)}</span>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { t, cart, drawer, setDrawer, config } = useApp();
  const nav = useNavigate();
  if (!drawer) return null;
  const tot = calcTotals(cart, config);
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-bg shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-2xl">{t('yourBag')}</h2>
          <button onClick={() => setDrawer(false)} aria-label={t('close')}><X size={22} /></button>
        </div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <ShoppingBag size={40} className="text-muted" strokeWidth={1.2} />
            <p className="text-muted">{t('emptyBag')}</p>
            <button className="btn-outline" onClick={() => { setDrawer(false); nav('/products'); }}>{t('continueShopping')}</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">{cart.map((i) => <CartLine key={i.key} i={i} />)}</div>
            <div className="space-y-3 border-t border-line p-5">
              <Progress cfg={config} tot={tot} t={t} />
              <div className="flex justify-between text-sm"><span className="text-muted">{t('subtotal')}</span><span>{money(tot.subtotal)}</span></div>
              {tot.discount > 0 && <div className="flex justify-between text-sm text-accent"><span>{t('discount')} ({tot.tier.percent}%)</span><span>-{money(tot.discount)}</span></div>}
              <button className="btn w-full" onClick={() => { setDrawer(false); nav('/checkout'); }}>{t('checkout')} · {money(tot.subtotal - tot.discount)}</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
