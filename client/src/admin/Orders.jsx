import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Download, Mail, MessageCircle, Trash2 } from 'lucide-react';
import { adm, downloadCsv, fmtDate, notify, STATUSES, useAdm } from './api';
import { Badge, Card, CopyBox, Err, Field, Loading, Td, Th, confirmDo, copyText } from './ui';
import { imgUrl, money } from '../lib/api';

export function OrderList() {
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '', q = sp.get('q') || '', page = parseInt(sp.get('page')) || 1;
  const [qq, setQq] = useState(q);
  const set = (patch) => { const n = new URLSearchParams(sp); Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k))); if (!('page' in patch)) n.delete('page'); setSp(n, { replace: true }); };
  const qs = new URLSearchParams({ page, limit: 20 }); if (status) qs.set('status', status); if (q) qs.set('q', q);
  const { data, loading, error, reload } = useAdm(`/orders?${qs}`);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Orders {data && <span className="text-sm font-normal text-muted">({data.total})</span>}</h1>
        <button className="btn-outline !py-2" onClick={() => downloadCsv(status).catch((e) => notify(e.message))}><Download size={14} />Export CSV</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['', ...STATUSES].map((s) => <button key={s} onClick={() => set({ status: s })} className={`chip !px-3 !py-1.5 text-xs capitalize ${status === s ? 'chip-on' : ''}`}>{s || 'All'}</button>)}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); set({ q: qq.trim() }); }} className="flex gap-2">
        <input className="input max-w-sm" placeholder="Search order no, phone or name…" value={qq} onChange={(e) => setQq(e.target.value)} />
        <button className="btn !py-2">Search</button>
        {q && <button type="button" className="btn-outline !py-2" onClick={() => { setQq(''); set({ q: '' }); }}>Clear</button>}
      </form>
      {error ? <Err msg={error} retry={reload} /> : loading && !data ? <Loading /> : (
        <div className="overflow-x-auto border border-line bg-bg">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-soft"><tr><Th>Order</Th><Th>Date</Th><Th>Customer</Th><Th>District</Th><Th>Items</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th></tr></thead>
            <tbody className="divide-y divide-line">
              {data.items.map((o) => (
                <tr key={o.id} className="hover:bg-soft">
                  <Td><Link to={`/admin/orders/${o.id}`} className="font-mono text-xs font-semibold underline underline-offset-2">{o.order_number}</Link></Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{fmtDate(o.created_at)}</Td>
                  <Td><div>{o.customer_name}</div><div className="text-xs text-muted">{o.phone}</div></Td>
                  <Td>{o.district}</Td><Td>{o.item_count}</Td><Td className="font-semibold">{money(o.total)}</Td>
                  <Td className="text-xs uppercase">{o.payment_method}{o.trx_id ? ' ✓' : ''}</Td><Td><Badge status={o.status} /></Td>
                </tr>
              ))}
              {!data.items.length && <tr><td colSpan="8" className="py-12 text-center text-muted">No orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button className="btn-outline !px-4 !py-2" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })}>Prev</button>
          <span className="text-muted">Page {page} / {data.pages}</span>
          <button className="btn-outline !px-4 !py-2" disabled={page >= data.pages} onClick={() => set({ page: String(page + 1) })}>Next</button>
        </div>
      )}
    </div>
  );
}

const waPhone = (p) => `880${String(p).replace(/\D/g, '').slice(-10)}`;

export function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: o, loading, error, reload, setData } = useAdm(`/orders/${id}`);
  const [tpl, setTpl] = useState(null);
  const [f, setF] = useState({ status: 'pending', note: '', courier_note: '', admin_note: '' });
  const [busy, setBusy] = useState(false);
  const loadTpl = () => adm(`/orders/${id}/templates?trackUrl=${encodeURIComponent(`${location.origin}/track`)}`).then(setTpl).catch(() => {});
  useEffect(() => { if (o) { setF({ status: o.status, note: '', courier_note: o.courier_note || '', admin_note: o.admin_note || '' }); loadTpl(); } /* eslint-disable-next-line */ }, [o?.id, o?.status, o?.courier_note]);

  if (loading && !o) return <Loading />;
  if (error) return <Err msg={error} retry={reload} />;
  const save = async () => {
    setBusy(true);
    try { setData(await adm(`/orders/${id}/status`, { method: 'PATCH', body: f })); notify('Order updated'); }
    catch (e) { notify(e.message); } finally { setBusy(false); }
  };
  const del = async () => { if (!confirmDo(`Delete order ${o.order_number} permanently? (Use Cancelled to keep a record.)`)) return; await adm(`/orders/${id}`, { method: 'DELETE' }); nav('/admin/orders'); };
  const Row = ({ k, v }) => <div className="flex justify-between gap-4 py-1.5 text-sm"><span className="text-muted">{k}</span><span className="text-right">{v}</span></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Link to="/admin/orders" className="text-xs text-muted hover:text-fg">‹ All orders</Link>
          <h1 className="mt-1 flex items-center gap-3 text-xl font-semibold"><span className="font-mono">{o.order_number}</span><Badge status={o.status} /></h1>
          <p className="text-xs text-muted">Placed {fmtDate(o.created_at)}</p></div>
        <button className="flex items-center gap-1.5 text-xs text-muted hover:text-accent" onClick={del}><Trash2 size={14} />Delete</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="Customer & delivery">
            <Row k="Name" v={o.customer_name} />
            <Row k="Phone" v={<span className="flex items-center gap-2">{o.phone}<button className="text-xs underline" onClick={() => copyText(o.phone)}>copy</button><a className="text-xs underline" href={`tel:${o.phone}`}>call</a></span>} />
            {o.email && <Row k="Email" v={o.email} />}
            <Row k="District" v={o.district} />
            <div className="mt-2 border-t border-line pt-3 text-sm"><div className="mb-1 text-muted">Address</div><div className="whitespace-pre-line">{o.address}</div><button className="mt-2 text-xs underline" onClick={() => copyText(`${o.customer_name}\n${o.phone}\n${o.address}, ${o.district}`)}>Copy name + phone + address (for courier)</button></div>
            {o.notes && <div className="mt-3 bg-soft p-3 text-sm"><div className="mb-1 text-xs text-muted">Customer note</div>{o.notes}</div>}
          </Card>
          <Card title="Items">
            {o.items.map((i) => (
              <div key={i.id} className="flex items-center gap-3 border-b border-line py-3 text-sm last:border-0">
                <div className="h-14 w-12 shrink-0 bg-soft">{i.image && <img src={imgUrl(i.image)} alt="" className="h-full w-full object-cover" />}</div>
                <div className="flex-1"><div>{i.name}</div><div className="text-xs text-muted">{Object.entries(i.options || {}).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}</div></div>
                <div className="text-muted">{money(i.price)} × {i.qty}</div><div className="w-24 text-right font-semibold">{money(i.price * i.qty)}</div>
              </div>
            ))}
            <div className="mt-3 border-t border-line pt-3">
              <Row k="Subtotal" v={money(o.subtotal)} />{Number(o.discount) > 0 && <Row k="Discount" v={`-${money(o.discount)}`} />}<Row k="Delivery" v={Number(o.shipping_fee) ? money(o.shipping_fee) : 'Free'} />
              <div className="flex justify-between pt-2 text-lg font-semibold"><span>Total</span><span>{money(o.total)}</span></div>
              <Row k="Payment" v={o.payment_method === 'bkash' ? 'bKash (advance)' : 'Cash on delivery'} />
              {o.payment_method === 'bkash' && <Row k="TrxID / sender" v={o.trx_id ? <b className="font-mono">{o.trx_id}</b> : <span className="text-accent">not provided — verify manually</span>} />}
              {o.payment_method === 'cod' && <p className="mt-1 text-right text-xs text-muted">Collect {money(o.total)} on delivery</p>}
            </div>
          </Card>
          <Card title="History">
            <ul className="space-y-2 text-sm">{[...o.history].reverse().map((h) => <li key={h.id} className="flex justify-between gap-3"><span><Badge status={h.status} /> {h.note && <span className="ml-1 text-muted">{h.note}</span>}</span><span className="shrink-0 text-xs text-muted">{fmtDate(h.created_at)}</span></li>)}</ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Update order">
            <div className="space-y-4">
              <Field label="Status"><select className="input capitalize" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Message shown to customer (optional)" hint="Appears in their tracking history."><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Packed and handed to courier" /></Field>
              <Field label="Courier / tracking info" hint="Shown to the customer on the Track page."><input className="input" value={f.courier_note} onChange={(e) => setF({ ...f, courier_note: e.target.value })} placeholder="e.g. Pathao, tracking 12345" /></Field>
              <Field label="Private note (only you see this)"><textarea className="input" rows={2} value={f.admin_note} onChange={(e) => setF({ ...f, admin_note: e.target.value })} /></Field>
              {(f.status === 'cancelled' || f.status === 'returned') && !['cancelled', 'returned'].includes(o.status) && <p className="text-xs text-muted">Stock for these items will be returned automatically.</p>}
              <button className="btn w-full" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </Card>
          {tpl && (
            <Card title="Copy-paste messages">
              <p className="mb-3 text-xs text-muted">Generated from the saved order status. Save changes first, then copy.</p>
              <div className="space-y-4">
                <CopyBox title="Message (English)" text={tpl.message_en} extra={<a className="flex items-center gap-1 text-[11px] underline" target="_blank" rel="noreferrer" href={`https://wa.me/${waPhone(o.phone)}?text=${encodeURIComponent(tpl.message_en)}`}><MessageCircle size={12} />WhatsApp</a>} />
                <CopyBox title="Message (বাংলা)" text={tpl.message_bn} extra={<a className="flex items-center gap-1 text-[11px] underline" target="_blank" rel="noreferrer" href={`https://wa.me/${waPhone(o.phone)}?text=${encodeURIComponent(tpl.message_bn)}`}><MessageCircle size={12} />WhatsApp</a>} />
                <CopyBox title={`Email — ${tpl.email.subject}`} text={tpl.email.body} extra={o.email && <a className="flex items-center gap-1 text-[11px] underline" href={`mailto:${o.email}?subject=${encodeURIComponent(tpl.email.subject)}&body=${encodeURIComponent(tpl.email.body)}`}><Mail size={12} />Open</a>} />
                <button className="text-xs underline" onClick={() => copyText(tpl.email.subject)}>Copy email subject</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
