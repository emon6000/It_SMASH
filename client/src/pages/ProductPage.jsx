import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Facebook, Heart, MessageCircle, Minus, Plus } from 'lucide-react';
import { useApp } from '../context';
import { useTitle } from '../lib/useTitle';
import { useFetch } from '../lib/useFetch';
import { money } from '../lib/api';
import Gallery from '../components/Gallery';
import ProductCard, { isSoldOut, pctOff } from '../components/ProductCard';
import { ErrorBox, Grid, SectionHead, Spinner } from '../components/ui';

export default function ProductPage() {
  const { slug } = useParams();
  const { t, L, addToCart, toggleWish, isWished, config, showToast } = useApp();
  const nav = useNavigate();
  const { data, loading, error, reload } = useFetch(`/products/${slug}`);
  const [sel, setSel] = useState({});
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');
  const [more, setMore] = useState(false);
  const [tiersOpen, setTiersOpen] = useState(false);
  useTitle(data?.product ? L(data.product, 'name') : '');
  useEffect(() => { setSel({}); setQty(1); setErr(''); setMore(false); window.scrollTo(0, 0); }, [slug]);

  if (loading && !data) return <Spinner />;
  if (error) return <div className="container-x"><ErrorBox onRetry={reload} /><p className="text-center"><Link to="/products" className="underline">{t('backToShop')}</Link></p></div>;
  const { product: p, related } = data;
  const sold = isSoldOut(p);
  const off = pctOff(p);
  const max = p.track_stock ? p.stock : 99;
  const desc = L(p, 'description') || '';
  const s = config?.site || {};
  const tiers = config?.discountTiers || [];

  const validate = () => {
    for (const g of p.options || []) if (!sel[g.name]) { setErr(t('pleaseChoose', { x: L(g, 'name') })); return false; }
    setErr(''); return true;
  };
  const add = () => { if (validate()) addToCart(p, sel, qty); };
  const buy = () => { if (validate()) { addToCart(p, sel, qty, false); nav('/checkout'); } };
  const msg = encodeURIComponent(`${p.name}${Object.values(sel).length ? ` (${Object.values(sel).join(', ')})` : ''} x ${qty}\n${location.href}`);

  return (
    <div className="container-x py-8">
      <Link to="/products" className="mb-6 inline-block text-[11px] uppercase tracking-[0.2em] text-muted hover:text-fg">‹ {t('backToShop')}</Link>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Gallery images={p.images} videos={p.videos} alt={L(p, 'name')} />
        <div>
          {p.category_name && <Link to={`/products?category=${p.category_slug}`} className="kicker hover:text-fg">{L({ name: p.category_name, name_bn: p.category_name_bn }, 'name')}</Link>}
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{L(p, 'name')}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-semibold">{money(p.price)}</span>
            {off > 0 && <><span className="text-muted line-through">{money(p.compare_price)}</span><span className="text-xs tracking-widest text-accent">{off}% {t('off2')}</span></>}
          </div>
          <p className={`mt-2 text-xs ${sold ? 'text-accent' : 'text-muted'}`}>{sold ? t('soldOut') : p.track_stock && p.stock <= 5 ? t('onlyLeft', { n: p.stock }) : t('inStock')}</p>

          {desc && (
            <div className="mt-5 text-sm leading-relaxed text-muted">
              <p className={`whitespace-pre-line ${more ? '' : 'line-clamp-4'}`}>{desc}</p>
              {desc.length > 160 && <button className="mt-1 text-xs underline underline-offset-4" onClick={() => setMore(!more)}>{more ? t('readLess') : t('readMore')}</button>}
            </div>
          )}

          {(p.options || []).map((g) => (
            <div key={g.name} className="mt-7">
              <div className="kicker mb-3 !text-fg">{L(g, 'name')}</div>
              <div className="flex flex-wrap gap-2">
                {g.values.map((v) => (
                  <button key={v.label} onClick={() => { setSel({ ...sel, [g.name]: v.label }); setErr(''); }} disabled={sold}
                    className={`min-w-12 border px-4 py-2.5 text-sm transition-colors ${sel[g.name] === v.label ? 'border-fg bg-fg text-bg' : 'border-line hover:border-fg'}`}>{L(v, 'label')}</button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-7">
            <div className="kicker mb-3">{t('quantity')}</div>
            <div className="inline-flex items-center border border-line">
              <button className="px-4 py-3" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="-"><Minus size={14} /></button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button className="px-4 py-3" onClick={() => setQty(Math.min(max, qty + 1))} aria-label="+"><Plus size={14} /></button>
            </div>
          </div>

          {tiers.length > 0 && (
            <div className="mt-6 border-y border-line">
              <button className="flex w-full items-center justify-between py-4 text-sm" onClick={() => setTiersOpen(!tiersOpen)}>
                <span>{t('buyMore')} <span className="ml-2 text-xs text-muted">{t('upTo')} {Math.max(...tiers.map((x) => x.percent))}% {t('off')}</span></span>
                <ChevronDown size={16} className={tiersOpen ? 'rotate-180' : ''} />
              </button>
              {tiersOpen && <div className="grid grid-cols-4 gap-2 pb-4 text-center">{tiers.map((x) => <div key={x.minQty} className="border border-line py-2"><div className="text-[10px] tracking-widest text-muted">{x.minQty}+ {t('pcs')}</div><div className="font-semibold">{x.percent}%</div></div>)}</div>}
            </div>
          )}

          {err && <p className="mt-4 text-sm text-accent">{err}</p>}
          <div className="mt-6 space-y-3">
            <button className="btn w-full" onClick={buy} disabled={sold}>{sold ? t('soldOut') : t('buyNow')}</button>
            <button className="btn-outline w-full" onClick={add} disabled={sold}>{t('addToBag')}</button>
            <button className="flex w-full items-center justify-center gap-2 py-2 text-xs text-muted hover:text-fg" onClick={() => toggleWish(p)}>
              <Heart size={15} className={isWished(p.id) ? 'fill-accent text-accent' : ''} />{t('wishlist')}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted">
            {s.whatsapp && <a className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-fg" href={`https://wa.me/${s.whatsapp}?text=${msg}`} target="_blank" rel="noreferrer"><MessageCircle size={13} />{t('orderOnWa')}</a>}
            {s.facebook && <a className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-fg" href={s.facebook} target="_blank" rel="noreferrer"><Facebook size={13} />{t('orderOnFb')}</a>}
          </div>
        </div>
      </div>
      {related?.length > 0 && (
        <section className="mt-20">
          <SectionHead title={t('related')} />
          <Grid>{related.slice(0, 8).map((r) => <ProductCard key={r.id} p={r} />)}</Grid>
        </section>
      )}
    </div>
  );
}
