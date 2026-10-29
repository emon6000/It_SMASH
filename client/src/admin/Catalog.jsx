import { useState } from 'react';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { adm, fmtDate, notify, useAdm } from './api';
import { Card, Err, Field, Loading, Toggle, confirmDo } from './ui';
import { SingleImage } from './Products';
import { imgUrl } from '../lib/api';

export function Categories() {
  const { data, loading, error, reload } = useAdm('/categories');
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { await adm(f.id ? `/categories/${f.id}` : '/categories', { method: f.id ? 'PUT' : 'POST', body: f }); notify('Saved'); setF(null); reload(); } catch (ex) { setErr(ex.message); }
  };
  const del = async (c) => { if (!confirmDo(`Delete category "${c.name}"? Its ${c.product_count} product(s) will become uncategorized.`)) return; await adm(`/categories/${c.id}`, { method: 'DELETE' }); reload(); };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Categories</h1><button className="btn !py-2.5" onClick={() => { setErr(''); setF({ name: '', name_bn: '', image_url: '', sort_order: (data?.length || 0), is_active: true }); }}><Plus size={14} />Add category</button></div>
      {f && (
        <Card title={f.id ? 'Edit category' : 'New category'}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (English) *"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Name (বাংলা, optional)"><input className="input" value={f.name_bn || ''} onChange={(e) => setF({ ...f, name_bn: e.target.value })} /></Field>
            <SingleImage label="Category image (home page card)" value={f.image_url} onChange={(u) => setF({ ...f, image_url: u })} />
            <div className="space-y-4">
              <Field label="Sort order" hint="Lower shows first."><input className="input" type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} /></Field>
              <label className="flex items-center justify-between text-sm">Visible<Toggle on={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label="Visible" /></label>
            </div>
            {err && <p className="text-sm text-accent sm:col-span-2">{err}</p>}
            <div className="flex gap-2 sm:col-span-2"><button className="btn">Save</button><button type="button" className="btn-outline" onClick={() => setF(null)}>Cancel</button></div>
          </form>
        </Card>
      )}
      {error ? <Err msg={error} retry={reload} /> : loading && !data ? <Loading /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <div key={c.id} className={`flex items-center gap-3 border border-line bg-bg p-3 ${c.is_active ? '' : 'opacity-60'}`}>
              <div className="h-16 w-16 shrink-0 bg-soft">{c.image_url && <img src={imgUrl(c.image_url)} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1"><div className="truncate font-medium">{c.name}</div><div className="text-xs text-muted">{c.name_bn} · {c.product_count} products · #{c.sort_order}</div></div>
              <button aria-label="Edit" onClick={() => { setErr(''); setF({ ...c }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil size={15} /></button>
              <button aria-label="Delete" className="text-muted hover:text-accent" onClick={() => del(c)}><Trash2 size={15} /></button>
            </div>
          ))}
          {!data.length && <p className="text-muted">No categories yet.</p>}
        </div>
      )}
    </div>
  );
}

export function Reviews() {
  const { data, loading, error, reload } = useAdm('/reviews');
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { await adm(f.id ? `/reviews/${f.id}` : '/reviews', { method: f.id ? 'PUT' : 'POST', body: f }); notify('Saved'); setF(null); reload(); } catch (ex) { setErr(ex.message); }
  };
  const del = async (r) => { if (!confirmDo(`Delete review from ${r.customer_name}?`)) return; await adm(`/reviews/${r.id}`, { method: 'DELETE' }); reload(); };
  const toggle = async (r) => { await adm(`/reviews/${r.id}`, { method: 'PUT', body: { ...r, is_active: !r.is_active } }); reload(); };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Reviews</h1><button className="btn !py-2.5" onClick={() => { setErr(''); setF({ customer_name: '', rating: 5, text: '', text_bn: '', photo_url: '', source: 'WhatsApp', is_active: true }); }}><Plus size={14} />Add review</button></div>
      <p className="text-xs text-muted">Add reviews customers send you on Facebook or WhatsApp (type the text, and/or upload a photo or screenshot).</p>
      {f && (
        <Card title={f.id ? 'Edit review' : 'New review'}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name *"><input className="input" required value={f.customer_name} onChange={(e) => setF({ ...f, customer_name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rating"><select className="input" value={f.rating} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select></Field>
              <Field label="Came from"><select className="input" value={f.source || 'WhatsApp'} onChange={(e) => setF({ ...f, source: e.target.value })}>{['WhatsApp', 'Facebook', 'Other'].map((s) => <option key={s}>{s}</option>)}</select></Field>
            </div>
            <Field label="Review text (English)"><textarea className="input" rows={3} value={f.text || ''} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
            <Field label="Review text (বাংলা / Banglish)"><textarea className="input" rows={3} value={f.text_bn || ''} onChange={(e) => setF({ ...f, text_bn: e.target.value })} /></Field>
            <SingleImage label="Photo / screenshot (optional)" value={f.photo_url} onChange={(u) => setF({ ...f, photo_url: u })} />
            <label className="flex items-center justify-between self-end text-sm">Visible on website<Toggle on={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} label="Visible" /></label>
            {err && <p className="text-sm text-accent sm:col-span-2">{err}</p>}
            <div className="flex gap-2 sm:col-span-2"><button className="btn">Save</button><button type="button" className="btn-outline" onClick={() => setF(null)}>Cancel</button></div>
          </form>
        </Card>
      )}
      {error ? <Err msg={error} retry={reload} /> : loading && !data ? <Loading /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => (
            <div key={r.id} className={`border border-line bg-bg p-4 ${r.is_active ? '' : 'opacity-60'}`}>
              <div className="flex gap-3">
                {r.photo_url && <img src={imgUrl(r.photo_url)} alt="" className="h-16 w-16 shrink-0 object-cover" />}
                <div className="min-w-0 flex-1"><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={12} className={n <= r.rating ? 'fill-fg text-fg' : 'text-line'} />)}</div>
                  <p className="mt-1 line-clamp-3 text-sm">{r.text || r.text_bn || <span className="text-muted">(photo only)</span>}</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted"><span>{r.customer_name} · {r.source} · {fmtDate(r.created_at)}</span></div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3"><Toggle on={r.is_active} onChange={() => toggle(r)} label="Visible" />
                <div className="flex gap-3"><button aria-label="Edit" onClick={() => { setErr(''); setF({ ...r }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil size={15} /></button><button aria-label="Delete" className="text-muted hover:text-accent" onClick={() => del(r)}><Trash2 size={15} /></button></div></div>
            </div>
          ))}
          {!data.length && <p className="text-muted">No reviews yet.</p>}
        </div>
      )}
    </div>
  );
}
