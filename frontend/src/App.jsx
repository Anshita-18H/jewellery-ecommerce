import { useEffect, useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Wishlist from './pages/Wishlist';
import { WishlistProvider } from './context/WishlistContext';
import { getCart } from './api';

export default function App() {
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(() => {
    getCart()
      .then((data) => setCartCount(data.item_count || 0))
      .catch(() => setCartCount(0));
  }, []);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  return (
    <WishlistProvider>
      <Navbar cartCount={cartCount} />
      <main>
        <Routes>
          <Route path="/" element={<Home onCartChange={refreshCartCount} />} />
          <Route path="/shop" element={<Shop onCartChange={refreshCartCount} />} />
          <Route path="/product/:slug" element={<ProductDetail onCartChange={refreshCartCount} />} />
          <Route path="/wishlist" element={<Wishlist onCartChange={refreshCartCount} />} />
          <Route path="/cart" element={<Cart onCartChange={refreshCartCount} />} />
          <Route path="/checkout" element={<Checkout onCartChange={refreshCartCount} />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </main>
      <Footer />
    </WishlistProvider>
  );
}