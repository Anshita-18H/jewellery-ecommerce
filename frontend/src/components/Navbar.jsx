import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ cartCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: 'Shop', to: '/shop' },
    { label: 'Rings', to: '/shop?category=rings' },
    { label: 'Necklaces', to: '/shop?category=necklaces' },
    { label: 'Bridal', to: '/shop?category=bridal' },
    { label: 'Gallery', to: '/gallery' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <button className="navbar-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/" className="navbar-logo">
          AURA
        </Link>

        <div className="navbar-actions">
          <Link to="/shop" className="navbar-icon-btn" aria-label="Search products">
            <Search size={18} strokeWidth={1.5} />
          </Link>
          <Link to="/cart" className="navbar-icon-btn navbar-cart" aria-label="View cart">
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cartCount > 0 && <span className="navbar-badge">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}