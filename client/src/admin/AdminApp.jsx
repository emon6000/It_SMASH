import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { LogOut, Moon, Sun, ExternalLink } from 'lucide-react';
import { useApp } from '../context';
import { adm, token } from './api';
import { Logo } from '../components/Header';
import Dashboard from './Dashboard';
import { OrderList, OrderDetail } from './Orders';
import { ProductList, ProductForm } from './Products';
import { Categories, Reviews } from './Catalog';
import Settings from './Settings';

function Login({ onDone }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const r = await adm('/login', { method: 'POST', body: { username: u, password: p } }); token.set(r.token); onDone(); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-soft p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 border border-line bg-bg p-8">
        <div className="text-center"><Logo className="text-xl" /><p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">Admin panel</p></div>
        <div><label className="label">Username</label><input className="input" autoFocus autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} required /></div>
        <div><label className="label">Password</label><input className="input" type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required /></div>
        {err && <p className="text-sm text-accent">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

const NAV = [['', 'Dashboard', true], ['orders', 'Orders'], ['products', 'Products'], ['categories', 'Categories'], ['reviews', 'Reviews'], ['settings', 'Settings']];

export default function AdminApp() {
  const { theme, toggleTheme } = useApp();
  const [authed, setAuthed] = useState(!!token.get());
  const [toast, setToast] = useState('');
  useEffect(() => {
    const out = () => setAuthed(false);
    let t;
    const tst = (e) => { setToast(e.detail); clearTimeout(t); t = setTimeout(() => setToast(''), 2200); };
    window.addEventListener('admin-logout', out); window.addEventListener('admin-toast', tst);
    return () => { window.removeEventListener('admin-logout', out); window.removeEventListener('admin-toast', tst); };
  }, []);
  useEffect(() => {
    document.title = 'It SMASH Admin';
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
    return () => m.remove();
  }, []);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  return (
    <div className="min-h-screen bg-soft">
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4">
          <div className="flex items-center gap-3"><Logo className="text-sm" /><span className="hidden bg-fg px-2 py-0.5 text-[10px] uppercase tracking-widest text-bg sm:inline">Admin</span></div>
          <div className="flex items-center gap-1">
            <Link to="/" target="_blank" className="flex h-9 items-center gap-1.5 px-3 text-xs text-muted hover:text-fg"><ExternalLink size={14} />View site</Link>
            <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center hover:bg-soft" aria-label="Theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button onClick={() => { token.clear(); setAuthed(false); }} className="flex h-9 items-center gap-1.5 px-3 text-xs hover:bg-soft"><LogOut size={14} />Logout</button>
          </div>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-[1280px] gap-1 overflow-x-auto px-4">
          {NAV.map(([to, label, end]) => (
            <NavLink key={to} to={`/admin/${to}`} end={end} className={({ isActive }) => `whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isActive ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg'}`}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 py-6">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<p className="py-20 text-center text-muted">Not found</p>} />
        </Routes>
      </main>
      {toast && <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 bg-fg px-5 py-3 text-sm text-bg shadow-lg">{toast}</div>}
    </div>
  );
}
