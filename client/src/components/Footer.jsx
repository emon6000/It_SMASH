import { Link } from 'react-router-dom';
import { Facebook, MessageCircle, Phone } from 'lucide-react';
import { useApp } from '../context';
import { Logo } from './Header';

export default function Footer() {
  const { t, L, categories, config } = useApp();
  const s = config?.site || {};
  const h = 'mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/60';
  const a = 'block py-1 text-sm text-white/85 hover:text-white';
  return (
    <footer className="mt-20 bg-[#120f18] text-white">
      <div className="bg-gradient-to-r from-[#ff7a59] via-[#ffbf47] to-[#7c8dff] px-4 py-8 text-[#181522]">
        <div className="container-x flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <h3 className="font-display text-3xl font-semibold">{t('orderVia')}</h3>
          <div className="flex flex-wrap gap-3">
            {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#1d1630] bg-white/75 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] hover:-translate-y-0.5"><Facebook size={15} />{t('viaFacebook')}</a>}
            {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#1d1630] bg-[#1d1630] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:-translate-y-0.5"><MessageCircle size={15} />{t('viaWhatsapp')}</a>}
          </div>
        </div>
      </div>
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo className="text-xl" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{t('footerAbout')}</p>
          <div className="mt-5 flex gap-2">
            {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:border-white hover:bg-white/10"><Facebook size={15} /></a>}
            {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:border-white hover:bg-white/10"><MessageCircle size={15} /></a>}
          </div>
        </div>
        <div>
          <div className={h}>{t('shop')}</div>
          <Link to="/products" className={a}>{t('allProducts')}</Link>
          {categories.map((c) => <Link key={c.id} to={`/products?category=${c.slug}`} className={a}>{L(c, 'name')}</Link>)}
        </div>
        <div>
          <div className={h}>{t('help')}</div>
          <Link to="/track" className={a}>{t('trackOrder')}</Link>
          <a href="/#reviews" className={a}>{t('reviews')}</a>
          <Link to="/wishlist" className={a}>{t('wishlist')}</Link>
        </div>
        <div>
          <div className={h}>{t('talkToUs')}</div>
          {s.phone && <a href={`tel:${s.phone}`} className="mb-2 flex items-center gap-2 text-lg"><Phone size={16} className="text-white/50" />{s.phone}</a>}
          {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">WhatsApp</a>}
          <p className="mt-4 text-xs leading-relaxed text-white/50">{t('deliveryInfo')}</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-5 text-xs text-white/50">© {new Date().getFullYear()} {s.name || 'It SMASH'} · {t('rights')}</div>
      </div>
    </footer>
  );
}
