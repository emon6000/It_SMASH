import { Link } from 'react-router-dom';
import { useAdm, STATUSES } from './api';
import { Badge, Card, Err, Loading } from './ui';
import { money } from '../lib/api';

const Stat = ({ label, value, to }) => (
  <Link to={to} className="block border border-line bg-bg p-5 transition-colors hover:border-fg"><div className="text-[11px] uppercase tracking-wider text-muted">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></Link>
);

export default function Dashboard() {
  const { data, loading, error, reload } = useAdm('/stats');
  const recent = useAdm('/orders?limit=6');
  if (loading && !data) return <Loading />;
  if (error) return <Err msg={error} retry={reload} />;
  const n = (s) => data.byStatus.find((x) => x.status === s)?.n || 0;
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="New (pending) orders" value={n('pending')} to="/admin/orders?status=pending" />
        <Stat label="Orders today" value={data.today.orders} to="/admin/orders" />
        <Stat label="Today's sales" value={money(data.today.revenue)} to="/admin/orders" />
        <Stat label="Delivered revenue" value={money(data.deliveredRevenue)} to="/admin/orders?status=delivered" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Orders by status">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {STATUSES.map((s) => <Link key={s} to={`/admin/orders?status=${s}`} className="border border-line p-3 text-center hover:border-fg"><div className="text-xl font-semibold">{n(s)}</div><Badge status={s} /></Link>)}
          </div>
        </Card>
        <Card title="Low stock (5 or less)" action={<Link className="text-xs underline" to="/admin/products?status=lowstock">View</Link>}>
          {data.lowStock.length === 0 ? <p className="text-sm text-muted">All good — nothing running low.</p> : (
            <ul className="divide-y divide-line text-sm">{data.lowStock.map((p) => <li key={p.id} className="flex justify-between py-2"><Link to={`/admin/products/${p.id}`} className="hover:underline">{p.name}</Link><span className={p.stock === 0 ? 'text-accent' : ''}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span></li>)}</ul>
          )}
        </Card>
      </div>
      <Card title="Recent orders" action={<Link className="text-xs underline" to="/admin/orders">All orders</Link>}>
        {recent.data?.items?.length ? (
          <ul className="divide-y divide-line text-sm">
            {recent.data.items.map((o) => (
              <li key={o.id}><Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-soft">
                <span className="font-mono text-xs">{o.order_number}</span><span className="hidden flex-1 truncate sm:block">{o.customer_name}</span><span>{money(o.total)}</span><Badge status={o.status} /></Link></li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">No orders yet.</p>}
      </Card>
    </div>
  );
}
