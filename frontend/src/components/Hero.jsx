import { Link } from 'react-router-dom';
import './Hero.css';

export default function Hero({ product }) {
  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-inner container">
        <div className="hero-copy">
          <p className="eyebrow">New Arrival</p>
          <h1 className="hero-title">
            Eternal
            <br />
            Radiance
          </h1>
          <p className="hero-subtitle">Discover the Timeless Brilliance</p>
          <div className="hero-cta-row">
            <Link to="/shop?category=necklaces" className="btn btn-gold">
              Shop Diamond
            </Link>
            {product && <span className="hero-price">{Number(product.price).toLocaleString()} </span>}
          </div>
        </div>

        <div className="hero-stage">
          <div className="hero-pedestal" />
          {product?.image_url && (
            <img className="hero-product-img" src={product.image_url} alt={product.name} />
          )}
        </div>
      </div>
    </section>
  );
}