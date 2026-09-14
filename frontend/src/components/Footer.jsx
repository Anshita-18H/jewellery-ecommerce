import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
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
          <p className="footer-heading">Collections</p>
          <ul className="footer-links">
            <li><Link to="/shop?category=rings">Rings</Link></li>
            <li><Link to="/shop?category=necklaces">Necklaces</Link></li>
            <li><Link to="/shop?category=earrings">Earrings</Link></li>
            <li><Link to="/shop?category=bridal">Bridal</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <p className="footer-heading">Brand</p>
          <ul className="footer-links">
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/login">Client Sign In</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <p className="footer-heading">Service</p>
          <p className="footer-contact-line">
            <MapPin size={14} strokeWidth={1.5} /> Indore, Madhya Pradesh
          </p>
          <a
            href="https://wa.me/910000000000"
            className="footer-contact-line footer-wa-link"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp Concierge
          </a>
        </div>
      </div>

      <div className="footer-bottom container">
        <span className="footer-copyright">
          © 2026 AURA Fine Jewellery. All rights reserved.
        </span>
      </div>
    </footer>
  );
}