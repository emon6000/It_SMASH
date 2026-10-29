import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';
import { STR } from './lib/i18n';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const read = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full/blocked */ } };

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  const [lang, setLang] = useState(() => read('msmart_lang', 'en'));
  const [cart, setCart] = useState(() => read('msmart_cart', []));
  const [wish, setWish] = useState(() => read('msmart_wish', []));
  const [config, setConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('msmart_theme', theme); } catch { /* ignore */ }
  }, [theme]);
  useEffect(() => { write('msmart_lang', lang); document.documentElement.lang = lang; }, [lang]);
  useEffect(() => write('msmart_cart', cart), [cart]);
  useEffect(() => write('msmart_wish', wish), [wish]);
  useEffect(() => {
    api('/config').then(setConfig).catch(() => {});
    api('/categories').then(setCategories).catch(() => {});
  }, []);
  // keep tabs/devices-in-same-browser in sync
  useEffect(() => {
    const h = (e) => { if (e.key === 'msmart_cart') setCart(read('msmart_cart', [])); if (e.key === 'msmart_wish') setWish(read('msmart_wish', [])); };
    window.addEventListener('storage', h); return () => window.removeEventListener('storage', h);
  }, []);

  const t = useCallback((k, vars) => {
    let s = (STR[lang] && STR[lang][k]) || STR.en[k] || k;
    if (vars) Object.entries(vars).forEach(([a, b]) => { s = s.replace(`{${a}}`, b); });
    return s;
  }, [lang]);
  // pick Bangla field if language is Bangla and it is filled, else English
  const L = useCallback((o, f) => (o ? (lang === 'bn' && o[`${f}_bn`] ? o[`${f}_bn`] : o[f]) : ''), [lang]);

  const showToast = useCallback((msg) => { setToast(msg); clearTimeout(showToast._t); showToast._t = setTimeout(() => setToast(null), 2200); }, []);

  const addToCart = useCallback((p, options = {}, qty = 1, open = true) => {
    const key = `${p.id}|${JSON.stringify(options)}`;
    setCart((c) => {
      const max = p.track_stock ? p.stock : 999;
      const ex = c.find((i) => i.key === key);
      if (ex) return c.map((i) => (i.key === key ? { ...i, qty: Math.min(max, i.qty + qty) } : i));
      return [...c, { key, productId: p.id, slug: p.slug, name: p.name, name_bn: p.name_bn, price: Number(p.price), image: (p.images || [])[0] || '', options, qty: Math.min(max, qty), max }];
    });
    if (open) setDrawer(true);
  }, []);
  const setQty = (key, qty) => setCart((c) => c.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(i.max || 999, qty)) } : i)));
  const removeItem = (key) => setCart((c) => c.filter((i) => i.key !== key));
  const clearCart = () => setCart([]);

  const toggleWish = (p) => {
    const has = wish.some((w) => w.id === p.id);
    setWish(has ? wish.filter((w) => w.id !== p.id) : [...wish, { id: p.id, slug: p.slug, name: p.name, name_bn: p.name_bn, price: p.price, compare_price: p.compare_price, images: (p.images || []).slice(0, 2), stock: p.stock, track_stock: p.track_stock, options: p.options }]);
    showToast(has ? t('removedWish') : t('savedWish'));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const value = useMemo(() => ({
    theme, toggleTheme: () => setTheme((x) => (x === 'dark' ? 'light' : 'dark')),
    lang, toggleLang: () => setLang((x) => (x === 'en' ? 'bn' : 'en')), t, L,
    cart, cartCount, addToCart, setQty, removeItem, clearCart,
    wish, toggleWish, isWished: (id) => wish.some((w) => w.id === id),
    config, categories, drawer, setDrawer, toast, showToast,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme, lang, t, L, cart, wish, config, categories, drawer, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
