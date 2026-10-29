import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Heart, Menu, MessageCircle, Moon, Search, ShoppingBag, Sun, X, Languages } from 'lucide-react';
import { useApp } from '../context';
import { money } from '../lib/api';

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-fg/10 bg-soft px-2.5 py-1.5 font-black tracking-[0.14em] ${className}`}>
      IT<span className="mx-[0.22em] text-accent">SMASH</span>
    </span>
  );
}

export default function Header() {
  const { t, L, lang, toggleLang, theme, toggleTheme, cartCount, wish, setDrawer, categories, config } = useApp();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [shopOpen, setShopOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => { setOpen(false); setSearchOpen(false); setShopOpen(false); }, [loc.pathname, loc.search]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);

  const wa = config?.site?.whatsapp ? `https://wa.me/${config.site.whatsapp}` : null;
  const submit = (e) => { e.preventDefault(); if (q.trim()) nav(`/products?q=${encodeURIComponent(q.trim())}`); };
  const ic = 'relative flex h-10 w-10 items-center justify-center rounded-full border border-fg/10 bg-soft text-fg hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent';
  const link = ({ isActive }) => `text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:text-fg ${isActive ? 'text-fg' : 'text-muted'}`;

  return (
    <>
      <div className="bg-gradient-to-r from-[#ff6b57] via-[#ffbf47] to-[#7c8dff] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.22em] text-[#17131c]">
        {config?.shipping?.freeThreshold ? `${t('freeShipOver')} ${money(config.shipping.freeThreshold)}` : t('announce')}
      </div>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/80 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-1 lg:hidden">
            <button className={ic} onClick={() => setOpen(true)} aria-label={t('menu')}><Menu size={20} /></button>
          </div>
          <Link to="/" className="text-base sm:text-lg"><Logo /></Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
              <button className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted hover:text-fg" onClick={() => nav('/products')}>
                {t('shop')} <ChevronDown size={13} />
              </button>
              {shopOpen && (
                <div className="absolute left-1/2 top-full w-56 -translate-x-1/2 pt-3">
                  <div className="rounded-2xl border border-line bg-bg py-2 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
                    <Link to="/products" className="block px-4 py-2 text-sm hover:bg-soft">{t('allProducts')}</Link>
                    {categories.map((c) => <Link key={c.id} to={`/products?category=${c.slug}`} className="block px-4 py-2 text-sm hover:bg-soft">{L(c, 'name')}</Link>)}
                  </div>
                </div>
              )}
            </div>
            <NavLink to="/products" end className={link}>{t('allProducts')}</NavLink>
            <a href="/#reviews" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted hover:text-fg">{t('reviews')}</a>
            <NavLink to="/track" className={link}>{t('track')}</NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <button className={ic} onClick={toggleLang} aria-label={t('language')} title={t('language')}>
              <span className="text-[10px] font-black">{lang === 'en' ? 'বাং' : 'EN'}</span>
            </button>
            <button className={ic} onClick={toggleTheme} aria-label={t('theme')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            {wa && <a className={`${ic} hidden sm:flex`} href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle size={18} /></a>}
            <button className={ic} onClick={() => setSearchOpen((s) => !s)} aria-label={t('search')}><Search size={18} /></button>
            <Link className={`${ic} hidden sm:flex`} to="/wishlist" aria-label={t('wishlist')}>
              <Heart size={18} />{wish.length > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{wish.length}</span>}
            </Link>
            <button className={ic} onClick={() => setDrawer(true)} aria-label={t('bag')}>
              <ShoppingBag size={18} />{cartCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{cartCount}</span>}
            </button>
          </div>
        </div>
        {searchOpen && (
          <form onSubmit={submit} className="border-t border-line bg-bg/90">
            <div className="container-x flex items-center gap-3 py-3">
              <Search size={18} className="text-muted" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPh')} className="flex-1 bg-transparent py-1 text-sm outline-none" />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label={t('close')}><X size={18} /></button>
            </div>
          </form>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-bg shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Logo className="text-base" />
              <button onClick={() => setOpen(false)} aria-label={t('close')}><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <button className="flex w-full items-center justify-between py-3 text-sm uppercase tracking-[0.2em]" onClick={() => setShopOpen((s) => !s)}>
                {t('shop')} <ChevronDown size={16} className={shopOpen ? 'rotate-180' : ''} />
              </button>
              {shopOpen && (
                <div className="mb-2 border-l border-line pl-4">
                  <Link to="/products" className="block py-2 text-sm text-muted">{t('allProducts')}</Link>
                  {categories.map((c) => <Link key={c.id} to={`/products?category=${c.slug}`} className="block py-2 text-sm text-muted">{L(c, 'name')}</Link>)}
                </div>
              )}
              {[['/products', t('allProducts')], ['/wishlist', t('wishlist')], ['/track', t('track')]].map(([to, label]) => (
                <Link key={to} to={to} className="block border-t border-line py-3 text-sm uppercase tracking-[0.2em]">{label}</Link>
              ))}
              <a href="/#reviews" onClick={() => setOpen(false)} className="block border-t border-line py-3 text-sm uppercase tracking-[0.2em]">{t('reviews')}</a>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="block border-t border-line py-3 text-sm uppercase tracking-[0.2em]">{t('contact')}</a>}
            </div>
            <div className="flex items-center gap-2 border-t border-line p-4">
              <button className="btn-outline flex-1 !py-2.5" onClick={toggleLang}><Languages size={15} />{lang === 'en' ? 'বাংলা' : 'English'}</button>
              <button className="btn-outline flex-1 !py-2.5" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}{t('theme')}</button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
