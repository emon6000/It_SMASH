import { Link, Navigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../context';
import { money } from '../lib/api';

export default function OrderSuccess() {
  const { state } = useLocation();
  const { t } = useApp();
  if (!state?.orderNumber) return <Navigate to="/" replace />;
  return (
    <div className="container-x flex flex-col items-center py-20 text-center">
      <CheckCircle2 size={52} strokeWidth={1.3} className="text-green-600" />
      <h1 className="mt-5 font-display text-4xl sm:text-5xl">{t('orderPlaced')}</h1>
      <p className="mt-2 text-muted">{t('thankYou')}</p>
      <div className="mt-8 border border-line bg-soft px-10 py-6">
        <div className="kicker">{t('yourOrderNo')}</div>
        <div className="mt-1 font-mono text-3xl tracking-wider">{state.orderNumber}</div>
        <div className="mt-2 text-sm text-muted">{t('total')}: <b className="text-fg">{money(state.total)}</b></div>
      </div>
      <p className="mt-6 max-w-md text-sm text-muted">{t('saveOrderNo')}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{state.paymentMethod === 'bkash' ? t('bkashAfter') : t('callSoon')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/track" className="btn">{t('trackOrder')}</Link>
        <Link to="/products" className="btn-outline">{t('continueShopping')}</Link>
      </div>
    </div>
  );
}
