import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Facebook, MessageCircle, Star } from 'lucide-react';
import { useApp } from '../context';
import { useTitle } from '../lib/useTitle';
import { useFetch } from '../lib/useFetch';
import { imgUrl, money } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { Grid, SectionHead, Spinner } from '../components/ui';

function Hero({ top }) {
  const { t } = useApp();
  const imgs = top.flatMap((p) => (p.images || []).slice(0, 1)).slice(0, 4);
  return (
    <section className="relative overflow-hidden border-b border-line/70">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,193,66,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(124,141,255,0.18),transparent_30%)]" />
      <div className="container-x relative grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <div className="mb-6 flex items-center gap-3"><span className="h-px w-10 bg-fg" /><span className="badge-pill">{t('heroKicker')}</span></div>
          <h1 className="font-display text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
            <span className="block text-fg">{t('heroTitle').split(' ').slice(0, 2).join(' ')}</span>
            <span className="mt-2 inline-block rounded-full bg-accent/10 px-3 py-1 text-accent">{t('heroTitle').split(' ').slice(2).join(' ') || 'daily joy'}</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">{t('heroText')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="btn">{t('shopCollection')}</Link>
            <Link to="/track" className="btn-outline !border-accent/70 !bg-accent/5 !shadow-[0_12px_24px_rgba(255,99,76,0.18)]">{t('trackOrder')}</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            <span className="badge-pill">15k+ happy shoppers</span>
            <span className="badge-pill">Same-day dispatch</span>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-4">
          {(imgs.length ? imgs : [null, null, null, null]).map((src, i) => {
            const product = top[i];
            const tile = (
              <div className={`group relative aspect-square overflow-hidden rounded-[30px] border border-line/80 bg-soft shadow-[0_25px_54px_rgba(0,0,0,0.08)] ${i % 2 ? 'translate-y-6' : ''}`}>
                {src && <img src={imgUrl(src)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                {!src && <div className="h-full w-full bg-gradient-to-br from-soft to-white" />}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full border border-white/30 bg-black/25 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                  <span>{i === 0 ? 'Hot pick' : i === 1 ? 'New in' : i === 2 ? 'Top rated' : 'Fresh drop'}</span>
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                </div>
              </div>
            );

            return product?.slug ? (
              <Link key={product.id || i} to={`/product/${product.slug}`} className="block focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-bg">
                {tile}
              </Link>
            ) : (
              <div key={i}>{tile}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TopProducts({ items }) {
  const { t, L, categories } = useApp();
  const [cat, setCat] = useState('all');
  const row = useRef(null);
  const cats = categories.filter((c) => items.some((p) => p.category_slug === c.slug));
  const shown = cat === 'all' ? items : items.filter((p) => p.category_slug === cat);
  const scroll = (d) => row.current?.scrollBy({ left: d * 320, behavior: 'smooth' });
  if (!items.length) return null;
  return (
    <section className="container-x py-16">
      <SectionHead kicker={t('topKicker')} title={t('topProducts')} to="/products" linkText={t('viewAll')} />
      <div className="mb-6 flex flex-wrap gap-2">
        <button className={`chip ${cat === 'all' ? 'chip-on' : ''}`} onClick={() => setCat('all')}>{t('all')}</button>
        {cats.map((c) => <button key={c.id} className={`chip ${cat === c.slug ? 'chip-on' : ''}`} onClick={() => setCat(c.slug)}>{L(c, 'name')}</button>)}
      </div>
      <div className="relative">
        <div ref={row} className="no-scrollbar flex snap-x gap-4 overflow-x-auto">
          {shown.map((p) => <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-[22.5%]"><ProductCard p={p} /></div>)}
        </div>
        <button onClick={() => scroll(-1)} aria-label="prev" className="absolute -left-3 top-[35%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-bg shadow lg:flex"><ChevronLeft size={18} /></button>
        <button onClick={() => scroll(1)} aria-label="next" className="absolute -right-3 top-[35%] hidden h-10 w-10 items-center justify-center rounded-full border border-line bg-bg shadow lg:flex"><ChevronRight size={18} /></button>
      </div>
    </section>
  );
}

function Categories() {
  const { t, L, categories } = useApp();
  const [sort, setSort] = useState('default');
  if (!categories.length) return null;
  const list = [...categories];
  if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'za') list.sort((a, b) => b.name.localeCompare(a.name));
  if (sort === 'count') list.sort((a, b) => b.product_count - a.product_count);
  return (
    <section className="container-x py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl sm:text-4xl">{t('shopByCategory')}</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-muted">{t('sortBy')}
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-line bg-bg px-2 py-1.5 text-xs text-fg">
              <option value="default">{t('sort_default')}</option><option value="az">{t('sort_az')}</option><option value="za">{t('sort_za')}</option><option value="count">{t('sort_count')}</option>
            </select>
          </label>
          <Link to="/products" className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em]">{t('viewAll')} →</Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {list.map((c) => (
          <Link key={c.id} to={`/products?category=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-soft">
            {c.image_url && <img src={imgUrl(c.image_url)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 text-white">
              <div className="font-display text-2xl uppercase tracking-wide sm:text-3xl">{L(c, 'name')}</div>
              <div className="text-xs text-white/70">{c.product_count} {t('results')}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BuyMore() {
  const { t, config } = useApp();
  const tiers = config?.discountTiers || [];
  if (!tiers.length) return null;
  const max = Math.max(...tiers.map((x) => x.percent));
  return (
    <section className="container-x py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-6 border-y border-fg py-6 sm:flex-row">
        <div>
          <div className="kicker">{t('buyMore')}</div>
          <div className="text-3xl font-semibold tracking-tight">{t('upTo')} {max}% {t('off')}</div>
          <p className="mt-1 max-w-xs text-xs text-muted">{t('buyMoreSub')}</p>
        </div>
        <div className="flex divide-x divide-line">
          {tiers.map((x) => (
            <div key={x.minQty} className="px-4 text-center">
              <div className="text-[11px] tracking-widest text-muted">{x.minQty}+ {t('pcs')}</div>
              <div className="text-xl font-semibold">{x.percent}%</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Latest() {
  const { t, L, categories } = useApp();
  const [cat, setCat] = useState('');
  const { data, loading } = useFetch(`/products?limit=8${cat ? `&category=${cat}` : ''}`);
  return (
    <section className="container-x py-12">
      <SectionHead kicker={t('latestKicker')} title={t('latest')} to="/products" linkText={t('viewAll')} />
      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line no-scrollbar">
        {[{ slug: '', name: t('all') }, ...categories.map((c) => ({ slug: c.slug, name: L(c, 'name') }))].map((c) => (
          <button key={c.slug} onClick={() => setCat(c.slug)} className={`-mb-px whitespace-nowrap border-b pb-3 text-xs uppercase tracking-[0.18em] ${cat === c.slug ? 'border-fg text-fg' : 'border-transparent text-muted'}`}>{c.name}</button>
        ))}
      </div>
      {loading && !data ? <Spinner /> : <Grid>{(data?.items || []).map((p) => <ProductCard key={p.id} p={p} />)}</Grid>}
    </section>
  );
}

function Reviews() {
  const { t, L, config } = useApp();
  const { data } = useFetch('/reviews');
  const row = useRef(null);
  const s = config?.site || {};
  return (
    <section id="reviews" className="mt-12 scroll-mt-20 bg-soft py-16">
      <div className="container-x">
        <div className="kicker mb-2">{t('reviewsKicker')}</div>
        <h2 className="font-display text-4xl sm:text-5xl">{t('reviewsTitle')}</h2>
        <p className="mt-3 max-w-md text-sm text-muted">{t('reviewsSub')}</p>
        <div ref={row} className="no-scrollbar -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {(data || []).map((r) => (
            <article key={r.id} className="w-[78%] shrink-0 snap-start border border-line bg-bg sm:w-[320px]">
              {r.photo_url && <img src={imgUrl(r.photo_url)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />}
              <div className="p-5">
                <div className="mb-3 flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= r.rating ? 'fill-fg text-fg' : 'text-line'} />)}</div>
                {(r.text || r.text_bn) && <p className="font-display text-xl italic leading-snug">“{L(r, 'text')}”</p>}
                <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted"><span>{r.customer_name}</span><span>{r.source}</span></div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="font-display text-2xl">{t('orderVia')}</div><p className="text-sm text-muted">{t('orderViaText')}</p></div>
          <div className="flex flex-wrap gap-3">
            {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" className="btn-outline"><Facebook size={15} />{t('viaFacebook')}</a>}
            {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="btn"><MessageCircle size={15} />{t('viaWhatsapp')}</a>}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: top } = useFetch('/products/top');
  useTitle('');
  return (
    <>
      <Hero top={top || []} />
      <TopProducts items={top || []} />
      <Categories />
      <BuyMore />
      <Latest />
      <Reviews />
    </>
  );
}
