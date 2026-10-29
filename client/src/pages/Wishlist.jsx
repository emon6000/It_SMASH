import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useApp } from '../context';
import { useTitle } from '../lib/useTitle';
import ProductCard from '../components/ProductCard';
import { Grid } from '../components/ui';

export default function Wishlist() {
  const { t, wish } = useApp();
  useTitle(t('wishlist'));
  return (
    <div className="container-x py-10">
      <h1 className="mb-8 font-display text-4xl sm:text-5xl">{t('wishlist')}</h1>
      {wish.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-muted"><Heart size={40} strokeWidth={1.2} /><p>{t('wishEmpty')}</p><Link to="/products" className="btn-outline">{t('continueShopping')}</Link></div>
      ) : <Grid>{wish.map((p) => <ProductCard key={p.id} p={p} />)}</Grid>}
    </div>
  );
}
