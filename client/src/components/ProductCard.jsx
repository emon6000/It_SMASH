import { Link, useNavigate } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { useApp } from '../context';
import { imgUrl, money } from '../lib/api';

export const pctOff = (p) => (p.compare_price && Number(p.compare_price) > Number(p.price) ? Math.round((1 - p.price / p.compare_price) * 100) : 0);
export const isSoldOut = (p) => p.track_stock && p.stock <= 0;

export default function ProductCard({ p }) {
  const { L, t, toggleWish, isWished, addToCart } = useApp();
  const nav = useNavigate();
  const imgs = p.images || [];
  const off = pctOff(p);
  const sold = isSoldOut(p);
  const quickAdd = (e) => {
    e.preventDefault();
    if (sold) return;
    if ((p.options || []).length) nav(`/product/${p.slug}`); else addToCart(p, {}, 1);
  };
  return (
    <Link to={`/product/${p.slug}`} className="group block rounded-[26px] border border-line/80 bg-bg/80 p-2 shadow-[0_18px_42px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-soft">
        {imgs[0] && <img src={imgUrl(imgs[0])} alt={L(p, 'name')} loading="lazy" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${imgs[1] ? 'group-hover:opacity-0' : ''}`} />}
        {imgs[1] && <img src={imgUrl(imgs[1])} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
        <button onClick={(e) => { e.preventDefault(); toggleWish(p); }} aria-label={t('wishlist')} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-bg/75 text-fg backdrop-blur-sm">
          <Heart size={17} className={isWished(p.id) ? 'fill-accent text-accent' : ''} />
        </button>
        {sold && <span className="absolute left-2 top-2 rounded-full bg-fg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-bg">{t('soldOut')}</span>}
        {off > 0 && <span className="absolute bottom-2 left-2 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">-{off}%</span>}
      </div>
      <div className="flex items-start justify-between gap-2 pt-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-fg">{L(p, 'name')}</h3>
        <button onClick={quickAdd} aria-label={t('addToBag')} disabled={sold} className="mt-0.5 shrink-0 rounded-full border border-line p-2 text-muted hover:border-accent/50 hover:bg-accent/5 hover:text-accent disabled:opacity-30"><Plus size={18} /></button>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className="font-bold text-fg">{money(p.price)}</span>
        {off > 0 && <><span className="text-muted line-through">{money(p.compare_price)}</span></>}
      </div>
    </Link>
  );
}
