import { useCallback, useEffect, useState } from 'react';
import { BASE } from '../lib/api';

const KEY = 'msmart_admin_token';
export const token = {
  get: () => { try { return localStorage.getItem(KEY); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(KEY, v); } catch { /* blocked */ } },
  clear: () => { try { localStorage.removeItem(KEY); } catch { /* blocked */ } },
};
export const notify = (m) => window.dispatchEvent(new CustomEvent('admin-toast', { detail: m }));

async function call(path, init) {
  const res = await fetch(`${BASE}/api/admin${path}`, init);
  if (res.status === 401 && path !== '/login') { token.clear(); window.dispatchEvent(new Event('admin-logout')); }
  return res;
}
const auth = () => ({ Authorization: `Bearer ${token.get()}` });

export async function adm(path, { method = 'GET', body } = {}) {
  const res = await call(path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...auth() }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'Request failed');
  return data;
}

export async function uploadImages(files) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append('images', f));
  const res = await call('/upload', { method: 'POST', headers: auth(), body: fd });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || 'Upload failed');
  return data.urls;
}

export async function downloadCsv(status = '') {
  const res = await call(`/orders-export.csv${status ? `?status=${status}` : ''}`, { headers: auth() });
  if (!res.ok) throw new Error('Export failed');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url);
}

export function useAdm(path) {
  const [s, setS] = useState({ data: null, loading: true, error: '' });
  const load = useCallback(() => {
    if (!path) return;
    setS((x) => ({ ...x, loading: true, error: '' }));
    adm(path).then((data) => setS({ data, loading: false, error: '' })).catch((e) => setS({ data: null, loading: false, error: e.message }));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { ...s, reload: load, setData: (data) => setS((x) => ({ ...x, data })) };
}

export const fmtDate = (d) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
export const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
export const STATUS_COLOR = {
  pending: 'bg-amber-500/15 text-amber-600', confirmed: 'bg-blue-500/15 text-blue-600', processing: 'bg-violet-500/15 text-violet-600',
  shipped: 'bg-cyan-500/15 text-cyan-600', delivered: 'bg-green-500/15 text-green-600', cancelled: 'bg-red-500/15 text-red-600', returned: 'bg-orange-500/15 text-orange-600',
};
