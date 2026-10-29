import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from './context';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FloatingButtons from './components/FloatingButtons';
import { Toast } from './components/ui';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductPage from './pages/ProductPage';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Track from './pages/Track';
import AdminApp from './admin/AdminApp';

function NotFound() {
  const { t } = useApp();
  return <div className="container-x py-28 text-center"><h1 className="font-display text-5xl">404</h1><p className="mt-3 text-muted">{t('notFound')}</p><Link to="/" className="btn mt-8">{t('goHome')}</Link></div>;
}

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 150);
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  if (pathname.startsWith('/admin')) return <Routes><Route path="/admin/*" element={<AdminApp />} /></Routes>;
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/track" element={<Track />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <FloatingButtons />
      <Toast />
    </>
  );
}
