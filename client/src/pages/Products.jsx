import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context';
import { useTitle } from '../lib/useTitle';
import { useFetch } from '../lib/useFetch';
import ProductCard from '../components/ProductCard';
import { ErrorBox, Grid, Spinner } from '../components/ui';

export default function Products() {
  const { t, L, categories } = useApp();
  const [sp, setSp] = useSearchParams();
  const [showF, setShowF] = useState(false);
  const q = sp.get('q') || '', category = sp.get('category') || '', sort = sp.get('sort') || 'newest';
  const min = sp.get('min') || '', max = sp.get('max') || '', inStock = sp.get('inStock') || '';
  const page = parseInt(sp.get('page')) || 1;
  const [pr, setPr] = useState({ min, max });
  useEffect(() => setPr({ min, max }), [min, max]);

  const set = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setSp(n, { replace: true });
  };
  const qs = new URLSearchParams({ limit: String(12 * page), sort });
  if (q) qs.set('q', q); if (category) qs.set('category', category); if (min) qs.set('min', min); if (max) qs.set('max', max); if (inStock) qs.set('inStock', '1');
  const { data, loading, error, reload } = useFetch(`/products?${qs}`);
  const activeCat = categories.find((c) => c.slug === category);
  useTitle(activeCat ? L(activeCat, 'name') : t('allProducts'));
  const hasFilters = q || category || min || max || inStock;

  const Filters = (
    <div className="space-y-7">
      <div>
        <div className="kicker mb-3">{t('category')}</div>
        <div className="flex flex-col items-start gap-1.5">
          <button className={`text-sm ${!category ? 'font-semibold' : 'text-muted'}`} onClick={() => set({ category: '' })}>{t('all')}</button>
          {categories.map((c) => <button key={c.id} className={`text-sm ${category === c.slug ? 'font-semibold' : 'text-muted hover:text-fg'}`} onClick={() => set({ category: c.slug })}>{L(c, 'name')} <span className="text-xs text-muted">({c.product_count})</span></button>)}
        </div>
      </div>
      <div>
        <div className="kicker mb-3">{t('price')} (৳)</div>
        <div className="flex items-center gap-2">
          <input className="input border border-accent/40 bg-bg/90" type="number" min="0" placeholder={t('min')} value={pr.min} onChange={(e) => setPr({ ...pr, min: e.target.value })} />
          <span className="text-muted">–</span>
          <input className="input border border-accent/40 bg-bg/90" type="number" min="0" placeholder={t('max')} value={pr.max} onChange={(e) => setPr({ ...pr, max: e.target.value })} />
        </div>
        <button className="btn-outline mt-2 w-full !py-2" onClick={() => set({ min: pr.min, max: pr.max })}>{t('apply')}</button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={!!inStock} onChange={(e) => set({ inStock: e.target.checked ? '1' : '' })} className="h-4 w-4 accent-accent" />{t('inStockOnly')}
      </label>
      {hasFilters && <button className="text-xs uppercase tracking-[0.18em] underline underline-offset-4" onClick={() => setSp({}, { replace: true })}>{t('clear')}</button>}
    </div>
  );

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <div className="kicker mb-2">{q ? `“${q}”` : t('shop')}</div>
        <h1 className="font-display text-4xl sm:text-5xl">{activeCat ? L(activeCat, 'name') : t('allProducts')}</h1>
      </div>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{Filters}</aside>
        <div>
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-line pb-4">
            <button className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] lg:hidden" onClick={() => setShowF(true)}><SlidersHorizontal size={15} />{t('filters')}</button>
            <span className="hidden text-sm text-muted lg:block">{data ? `${data.total} ${t('results')}` : ''}</span>
            <label className="flex items-center gap-2 text-xs text-muted">{t('sortBy')}
              <select value={sort} onChange={(e) => set({ sort: e.target.value })} className="input border border-accent/40 bg-bg/90 !w-auto px-2 py-1.5 text-xs text-fg">
                <option value="newest">{t('sort_newest')}</option><option value="price_asc">{t('sort_price_asc')}</option><option value="price_desc">{t('sort_price_desc')}</option>
                <option value="name_asc">{t('sort_az')}</option><option value="name_desc">{t('sort_za')}</option>
              </select>
            </label>
          </div>
          {error ? <ErrorBox onRetry={reload} /> : loading && !data ? <Spinner /> : data?.items?.length ? (
            <>
              <Grid>{data.items.map((p) => <ProductCard key={p.id} p={p} />)}</Grid>
              {data.items.length < data.total && (
                <div className="mt-12 text-center">
                  <p className="mb-3 text-xs text-muted">{t('showing')} {data.items.length} / {data.total}</p>
                  <button className="btn-outline" onClick={() => set({ page: String(page + 1) })}>{t('loadMore')}</button>
                </div>
              )}
            </>
          ) : <p className="py-20 text-center text-muted">{t('noProducts')}</p>}
        </div>
      </div>
      {showF && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowF(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-bg p-6">
            <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{t('filters')}</h2><button onClick={() => setShowF(false)} aria-label={t('close')}><X size={22} /></button></div>
            {Filters}
            <button className="btn mt-6 w-full" onClick={() => setShowF(false)}>{t('apply')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
