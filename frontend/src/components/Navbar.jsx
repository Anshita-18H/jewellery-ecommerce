import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Heart, LogOut, Shield } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ cartCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const { wishlistCount } = useWishlist();
  const { user, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Account Icon & Dropdown Menu */}
          <div className="navbar-account-wrap" ref={accountRef}>
            <button
              type="button"
              className="navbar-icon-btn navbar-account"
              onClick={() => setAccountOpen((prev) => !prev)}
              aria-label={user ? `Signed in as ${user.name}` : 'Sign in or create account'}
              title={user ? `Account: ${user.name}` : 'Sign In'}
            >
              <User size={19} strokeWidth={1.75} />
              {user && <span className="navbar-auth-dot" />}
            </button>

            {accountOpen && (
              <div className="navbar-account-dropdown">
                {user ? (
                  <>
                    <div className="navbar-dropdown-header">
                      <p className="navbar-dropdown-user-greeting">Signed in as</p>
                      <p className="navbar-dropdown-user-name">{user.name}</p>
                      <p className="navbar-dropdown-user-email">{user.email}</p>
                    </div>
                    <div className="navbar-dropdown-menu">
                      <Link
                        to="/login"
                        className="navbar-dropdown-item"
                        onClick={() => setAccountOpen(false)}
                      >
                        <User size={15} />
                        <span>My Account</span>
                      </Link>
                      <Link
                        to="/wishlist"
                        className="navbar-dropdown-item"
                        onClick={() => setAccountOpen(false)}
                      >
                        <Heart size={15} />
                        <span>My Wishlist ({wishlistCount})</span>
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="navbar-dropdown-item"
                          onClick={() => setAccountOpen(false)}
                        >
                          <Shield size={15} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        className="navbar-dropdown-item navbar-dropdown-logout"
                        onClick={() => {
                          setAccountOpen(false);
                          logout();
                        }}
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="navbar-dropdown-header">
                      <p className="navbar-dropdown-user-name">Welcome to AURA</p>
                      <p className="navbar-dropdown-user-sub">Sign in to view your private wishlist</p>
                    </div>
                    <div className="navbar-dropdown-menu">
                      <button
                        type="button"
                        className="navbar-dropdown-btn-primary"
                        onClick={() => {
                          setAccountOpen(false);
                          openAuthModal({ mode: 'login' });
                        }}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        className="navbar-dropdown-btn-secondary"
                        onClick={() => {
                          setAccountOpen(false);
                          openAuthModal({ mode: 'signup' });
                        }}
                      >
                        Create Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

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