import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pencil, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import { adm, notify, uploadImages, useAdm } from './api';
import { Card, Err, Field, Loading, Td, Th, Toggle, confirmDo } from './ui';
import { imgUrl, money } from '../lib/api';

export function SingleImage({ value, onChange, label = 'Image' }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    if (!e.target.files.length) return;
    setBusy(true);
    try { const [u] = await uploadImages(e.target.files); onChange(u); } catch (ex) { notify(ex.message); } finally { setBusy(false); e.target.value = ''; }
  };
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="h-20 w-20 shrink-0 border border-line bg-soft">{value && <img src={imgUrl(value)} alt="" className="h-full w-full object-cover" />}</div>
        <div className="space-y-2">
          <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
          <button type="button" className="btn-outline !px-4 !py-2" onClick={() => ref.current.click()} disabled={busy}><Upload size={14} />{busy ? 'Uploading…' : 'Upload'}</button>
          {value && <button type="button" className="block text-xs text-muted underline" onClick={() => onChange('')}>Remove</button>}
        </div>
      </div>
    </Field>
  );
}

export function ProductList() {
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '', q = sp.get('q') || '';
  const [qq, setQq] = useState(q);
  const qs = new URLSearchParams(); if (status) qs.set('status', status); if (q) qs.set('q', q);
  const { data, loading, error, reload, setData } = useAdm(`/products?${qs}`);
  const set = (patch) => { const n = new URLSearchParams(sp); Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); setSp(n, { replace: true }); };
  const patch = async (p, body) => {
    try { const r = await adm(`/products/${p.id}`, { method: 'PATCH', body }); setData(data.map((x) => (x.id === p.id ? { ...x, ...r } : x))); notify('Saved'); }
    catch (e) { notify(e.message); }
  };
  const del = async (p) => { if (!confirmDo(`Delete "${p.name}"? This cannot be undone. (Hide it instead to keep it.)`)) return; await adm(`/products/${p.id}`, { method: 'DELETE' }); reload(); };
  const topCount = data ? data.filter((p) => p.is_top).length : 0;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Products {data && <span className="text-sm font-normal text-muted">({data.length})</span>}</h1>
        <Link to="/admin/products/new" className="btn !py-2.5"><Plus size={14} />Add product</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {[['', 'All'], ['active', 'Visible'], ['hidden', 'Hidden'], ['top', 'Top products'], ['lowstock', 'Low stock']].map(([v, l]) => <button key={v} onClick={() => set({ status: v })} className={`chip !px-3 !py-1.5 text-xs ${status === v ? 'chip-on' : ''}`}>{l}</button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); set({ q: qq.trim() }); }} className="flex gap-2"><input className="input max-w-sm" placeholder="Search products…" value={qq} onChange={(e) => setQq(e.target.value)} /><button className="btn !py-2">Search</button></form>
      <p className="text-xs text-muted">The <b>Top</b> switch controls which products appear in “Top products” on the home page{data ? ` (${topCount} selected on this list)` : ''}.</p>
      {error ? <Err msg={error} retry={reload} /> : loading && !data ? <Loading /> : (
        <div className="overflow-x-auto border border-line bg-bg">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-soft"><tr><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Visible</Th><Th>Top</Th><Th> </Th></tr></thead>
            <tbody className="divide-y divide-line">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-soft">
                  <Td><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 bg-soft">{p.images[0] && <img src={imgUrl(p.images[0])} alt="" className="h-full w-full object-cover" />}</div><div><Link to={`/admin/products/${p.id}`} className="font-medium hover:underline">{p.name}</Link>{p.name_bn && <div className="text-xs text-muted">{p.name_bn}</div>}</div></div></Td>
                  <Td className="text-muted">{p.category_name || '—'}</Td>
                  <Td className="whitespace-nowrap">{money(p.price)}{p.compare_price && <span className="ml-1 text-xs text-muted line-through">{money(p.compare_price)}</span>}</Td>
                  <Td>{p.track_stock ? <input type="number" min="0" defaultValue={p.stock} key={p.stock} className={`input !w-20 !py-1.5 ${p.stock <= 5 ? 'border-accent' : ''}`} onBlur={(e) => { const v = parseInt(e.target.value); if (v >= 0 && v !== p.stock) patch(p, { stock: v }); }} /> : <span className="text-xs text-muted">not tracked</span>}</Td>
                  <Td><Toggle on={p.is_active} label="Visible" onChange={(v) => patch(p, { is_active: v })} /></Td>
                  <Td><button aria-label="Top product" onClick={() => patch(p, { is_top: !p.is_top })}><Star size={18} className={p.is_top ? 'fill-amber-400 text-amber-400' : 'text-muted'} /></button></Td>
                  <Td><div className="flex items-center justify-end gap-3"><Link to={`/admin/products/${p.id}`} aria-label="Edit"><Pencil size={15} /></Link><button onClick={() => del(p)} aria-label="Delete" className="text-muted hover:text-accent"><Trash2 size={15} /></button></div></Td>
                </tr>
              ))}
              {!data.length && <tr><td colSpan="7" className="py-12 text-center text-muted">No products.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const valuesToText = (vals) => (vals || []).map((v) => (v.label_bn ? `${v.label} | ${v.label_bn}` : v.label)).join('\n');
const textToValues = (t) => t.split('\n').map((l) => { const [a, b] = l.split('|'); return { label: (a || '').trim(), label_bn: (b || '').trim() }; }).filter((v) => v.label);
const EMPTY = { name: '', name_bn: '', description: '', description_bn: '', category_id: '', price: '', compare_price: '', stock: 0, track_stock: true, images: [], videosText: '', options: [], is_active: true, is_top: false, top_order: 0, slug: '' };
const PRESETS = { Size: ['S', 'M', 'L', 'XL', '2XL'], Color: ['Black', 'White', 'Red', 'Blue'] };

export function ProductForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id;
  const existing = useAdm(isNew ? null : `/products/${id}`);
  const cats = useAdm('/categories');
  const [p, setP] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const [err, setErr] = useState('');
  const [url, setUrl] = useState('');
  const fileRef = useRef(null);
  useEffect(() => {
    const d = existing.data;
    if (d) setP({ ...EMPTY, ...d, category_id: d.category_id || '', compare_price: d.compare_price || '', videosText: (d.videos || []).join('\n'), options: (d.options || []).map((g) => ({ name: g.name, name_bn: g.name_bn || '', valuesText: valuesToText(g.values) })) });
  }, [existing.data]);

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const upload = async (e) => {
    if (!e.target.files.length) return;
    setUp(true);
    try { const urls = await uploadImages(e.target.files); set('images', [...p.images, ...urls]); } catch (ex) { setErr(ex.message); } finally { setUp(false); e.target.value = ''; }
  };
  const move = (i, d) => { const a = [...p.images]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set('images', a); };
  const setOpt = (i, patch) => set('options', p.options.map((g, n) => (n === i ? { ...g, ...patch } : g)));
  const addPreset = (name) => set('options', [...p.options, { name, name_bn: name === 'Size' ? 'সাইজ' : name === 'Color' ? 'রং' : '', valuesText: (PRESETS[name] || []).join('\n') }]);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (!p.name.trim()) return setErr('Product name is required');
    if (p.price === '' || Number(p.price) < 0) return setErr('Enter a valid price');
    setBusy(true);
    const body = { ...p, videos: p.videosText.split('\n').map((s) => s.trim()).filter(Boolean), options: p.options.map((g) => ({ name: g.name, name_bn: g.name_bn, values: textToValues(g.valuesText) })) };
    try { await adm(isNew ? '/products' : `/products/${id}`, { method: isNew ? 'POST' : 'PUT', body }); notify(isNew ? 'Product added' : 'Product saved'); nav('/admin/products'); }
    catch (ex) { setErr(ex.message); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setBusy(false); }
  };

  if (!isNew && existing.loading && !existing.data) return <Loading />;
  if (!isNew && existing.error) return <Err msg={existing.error} />;
  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Link to="/admin/products" className="text-xs text-muted hover:text-fg">‹ Products</Link><h1 className="mt-1 text-xl font-semibold">{isNew ? 'Add product' : 'Edit product'}</h1></div>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
      </div>
      {err && <div className="border border-accent bg-accent/10 px-4 py-3 text-sm text-accent">{err}</div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (English) *"><input className="input" value={p.name} onChange={(e) => set('name', e.target.value)} /></Field>
              <Field label="Name (বাংলা / Banglish, optional)"><input className="input" value={p.name_bn || ''} onChange={(e) => set('name_bn', e.target.value)} /></Field>
              <Field label="Description (English)" className="sm:col-span-1"><textarea className="input" rows={5} value={p.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
              <Field label="Description (বাংলা / Banglish, optional)" hint="Shown to visitors who select বাংলা. Empty = English is shown."><textarea className="input" rows={5} value={p.description_bn || ''} onChange={(e) => set('description_bn', e.target.value)} /></Field>
            </div>
          </Card>
          <Card title="Images" action={<span className="text-xs text-muted">First image is the main image</span>}>
            <div className="mb-3 flex flex-wrap gap-3">
              {p.images.map((u, i) => (
                <div key={u + i} className="w-24">
                  <div className={`relative h-24 w-24 border bg-soft ${i === 0 ? 'border-fg' : 'border-line'}`}>
                    <img src={imgUrl(u)} alt="" className="h-full w-full object-cover" />
                    <button type="button" aria-label="Remove image" className="absolute right-0.5 top-0.5 bg-bg p-0.5" onClick={() => set('images', p.images.filter((_, n) => n !== i))}><X size={13} /></button>
                  </div>
                  <div className="mt-1 flex justify-between"><button type="button" aria-label="Move left" className="p-1 text-muted hover:text-fg" onClick={() => move(i, -1)}><ArrowLeft size={14} /></button><button type="button" aria-label="Move right" className="p-1 text-muted hover:text-fg" onClick={() => move(i, 1)}><ArrowRight size={14} /></button></div>
                </div>
              ))}
              {!p.images.length && <p className="text-sm text-muted">No images yet.</p>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={upload} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-outline !py-2" onClick={() => fileRef.current.click()} disabled={up}><Upload size={14} />{up ? 'Uploading…' : 'Upload images'}</button>
              <input className="input !w-64" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
              <button type="button" className="btn !py-2.5" onClick={() => { if (url.trim()) { set('images', [...p.images, url.trim()]); setUrl(''); } }}>Add URL</button>
            </div>
            <p className="mt-2 text-[11px] text-muted">JPG, PNG, WEBP or GIF up to 5MB each.</p>
          </Card>
          <Card title="Videos">
            <Field label="Video links (one per line)" hint="YouTube, Vimeo or a direct .mp4 link. They appear in the product gallery after the images."><textarea className="input font-mono text-xs" rows={3} value={p.videosText} onChange={(e) => set('videosText', e.target.value)} placeholder="https://www.youtube.com/watch?v=…" /></Field>
          </Card>
          <Card title="Options (Size, Color, Storage…)" action={<div className="flex gap-2 text-xs"><button type="button" className="underline" onClick={() => addPreset('Size')}>+ Size</button><button type="button" className="underline" onClick={() => addPreset('Color')}>+ Color</button><button type="button" className="underline" onClick={() => addPreset('')}>+ Custom</button></div>}>
            {!p.options.length && <p className="text-sm text-muted">No options — customers just add the product. Add “Size” for shirts, “Color”, “Storage”, etc. Leave this empty for items that need none.</p>}
            <div className="space-y-4">
              {p.options.map((g, i) => (
                <div key={i} className="border border-line p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Option name"><input className="input" value={g.name} onChange={(e) => setOpt(i, { name: e.target.value })} placeholder="Size" /></Field>
                    <Field label="Name in বাংলা (optional)"><input className="input" value={g.name_bn} onChange={(e) => setOpt(i, { name_bn: e.target.value })} /></Field>
                  </div>
                  <Field label="Values — one per line" hint="Optional Bangla label after “|”, e.g.  Red | লাল" className="mt-3"><textarea className="input font-mono text-xs" rows={4} value={g.valuesText} onChange={(e) => setOpt(i, { valuesText: e.target.value })} /></Field>
                  <button type="button" className="mt-2 text-xs text-muted underline hover:text-accent" onClick={() => set('options', p.options.filter((_, n) => n !== i))}>Remove this option</button>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Pricing & stock">
            <div className="space-y-4">
              <Field label="Price (৳) *"><input className="input" type="number" min="0" step="1" value={p.price} onChange={(e) => set('price', e.target.value)} /></Field>
              <Field label="Compare-at price (৳)" hint="Higher “old” price — shows a discount badge."><input className="input" type="number" min="0" value={p.compare_price} onChange={(e) => set('compare_price', e.target.value)} /></Field>
              <label className="flex items-center justify-between text-sm">Track stock<Toggle on={p.track_stock} onChange={(v) => set('track_stock', v)} label="Track stock" /></label>
              {p.track_stock ? <Field label="Stock quantity" hint="0 shows “Sold out”."><input className="input" type="number" min="0" value={p.stock} onChange={(e) => set('stock', e.target.value)} /></Field> : <p className="text-xs text-muted">Unlimited — never shows sold out.</p>}
            </div>
          </Card>
          <Card title="Organize">
            <div className="space-y-4">
              <Field label="Category"><select className="input" value={p.category_id} onChange={(e) => set('category_id', e.target.value)}><option value="">— None —</option>{(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <label className="flex items-center justify-between text-sm">Visible on website<Toggle on={p.is_active} onChange={(v) => set('is_active', v)} label="Visible" /></label>
              <label className="flex items-center justify-between text-sm">Top product (home page)<Toggle on={p.is_top} onChange={(v) => set('is_top', v)} label="Top" /></label>
              {p.is_top && <Field label="Top order" hint="Lower number shows first."><input className="input" type="number" value={p.top_order} onChange={(e) => set('top_order', e.target.value)} /></Field>}
              <Field label="URL slug (optional)" hint="Leave blank to generate from the name."><input className="input" value={p.slug || ''} onChange={(e) => set('slug', e.target.value)} /></Field>
            </div>
          </Card>
        </div>
      </div>
      <div className="flex justify-end"><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button></div>
    </form>
  );
}
