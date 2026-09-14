import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ cartCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'Rings', to: '/shop?category=rings' },
    { label: 'Necklaces', to: '/shop?category=necklaces' },
    { label: 'Bridal', to: '/shop?category=bridal' },
    { label: 'Gallery', to: '/gallery' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="navbar-left">
          <button
            className="navbar-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
            AURA
          </Link>
        </div>

        {/* Center: Main Navigation */}
        <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="navbar-actions">
          <Link to="/shop" className="navbar-icon-btn" aria-label="Search products" title="Search">
            <Search size={19} strokeWidth={1.75} />
          </Link>
          <Link
            to="/login"
            className="navbar-icon-btn navbar-account"
            aria-label={user ? `Signed in as ${user.name}` : 'Sign in to your account'}
            title={user ? `Signed in as ${user.name}` : 'Sign in'}
          >
            <User size={19} strokeWidth={1.75} />
            {user && <span className="navbar-auth-dot" />}
          </Link>
          <Link to="/wishlist" className="navbar-icon-btn navbar-wishlist" aria-label="View wishlist" title="Wishlist">
            <Heart size={19} strokeWidth={1.75} />
            {wishlistCount > 0 && <span className="navbar-badge">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="navbar-icon-btn navbar-cart" aria-label="View cart" title="Cart">
            <ShoppingBag size={19} strokeWidth={1.75} />
            {cartCount > 0 && <span className="navbar-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}