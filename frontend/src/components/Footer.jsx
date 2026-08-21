import { Link } from 'react-router-dom';
import { Search, MapPin, ShoppingBag } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-col">
          <p className="footer-logo">AURA</p>
          <p className="footer-tagline">Fine jewellery, made to last generations.</p>
        </div>

        <div className="footer-col">
          <p className="footer-heading">Shop</p>
          <ul className="footer-links">
            <li><Link to="/shop?category=rings">Rings</Link></li>
            <li><Link to="/shop?category=necklaces">Necklaces</Link></li>
            <li><Link to="/shop?category=earrings">Earrings</Link></li>
            <li><Link to="/shop?category=bridal">Bridal</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <p className="footer-heading">Explore</p>
          <ul className="footer-links">
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <p className="footer-heading">Contact</p>
          <p className="footer-contact-line">
            <MapPin size={14} strokeWidth={1.5} /> Indore, Madhya Pradesh
          </p>
          <a href="https://wa.me/910000000000" className="footer-contact-line" target="_blank" rel="noreferrer">
            WhatsApp Us
          </a>
        </div>
      </div>

      <div className="footer-bottom container">
        <span>© {new Date().getFullYear()} AURA. All rights reserved.</span>
        <div className="footer-bottom-icons">
          <Link to="/shop" aria-label="Search"><Search size={15} strokeWidth={1.5} /></Link>
          <Link to="/cart" aria-label="Cart"><ShoppingBag size={15} strokeWidth={1.5} /></Link>
        </div>
      </div>
    </footer>
  );
}