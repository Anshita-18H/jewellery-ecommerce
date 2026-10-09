import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import './NewArrivals.css';

export default function NewArrivals({ products = [] }) {
  // Dynamically calculate product counts from active catalog
  const totalCount = products.length;
  const ringCount = products.filter((p) => p.category_slug === 'rings').length;
  const necklaceCount = products.filter((p) => p.category_slug === 'necklaces').length;

  // Find the latest ring and necklace from active products to use real product images if available
  const latestRing = products.find((p) => p.category_slug === 'rings');
  const latestNecklace = products.find((p) => p.category_slug === 'necklaces');

  // High-resolution AURA editorial assets matching the brand palette
  const ringImage =
    latestRing?.image_url ||
    'https://images.unsplash.com/photo-1551811040-f13e57351ef3?w=1000&auto=format&fit=crop&q=85';
  const necklaceImage =
    latestNecklace?.image_url ||
    'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?w=1000&auto=format&fit=crop&q=85';

  // Dynamic badge text based on real product count
  const badgeText =
    totalCount > 0
      ? totalCount >= 10
        ? `${totalCount}+ New Pieces`
        : `${totalCount} New Pieces`
      : 'New Additions';

  const cards = [
    {
      id: 'new-rings',
      category: 'Rings',
      title: 'New Ring Collection',
      tag: 'Fine Rings Edit',
      subtitle: 'Sculpted in 18K rose gold & certified solitaire stones',
      image: ringImage,
      link: '/shop',
      itemCountText: ringCount > 0 ? `${ringCount} Designs Available` : 'Explore Rings',
      alt: 'New Ring Collection - Handcrafted rose gold and diamond rings',
    },
    {
      id: 'new-necklaces',
      category: 'Necklaces',
      title: 'New Necklace Collection',
      tag: 'Heirloom Neckwear',
      subtitle: 'Luminous freshwater pearls & regal temple-style creations',
      image: necklaceImage,
      link: '/shop',
      itemCountText: necklaceCount > 0 ? `${necklaceCount} Designs Available` : 'Explore Necklaces',
      alt: 'New Necklace Collection - Multi-layer pearl and temple design necklaces',
    },
  ];

  return (
    <section className="new-arrivals-section container" aria-labelledby="new-arrivals-title">
      <div className="home-section-header text-center new-arrivals-header">
        <p className="eyebrow">Fresh in Vault</p>
        <div className="new-arrivals-title-row">
          <h2 id="new-arrivals-title" className="section-title">
            New Arrivals
          </h2>
          {badgeText && (
            <span className="new-arrivals-badge" aria-label={`${totalCount} new pieces available`}>
              <Sparkles size={12} className="new-arrivals-badge-icon" aria-hidden="true" />
              {badgeText}
            </span>
          )}
        </div>
        <p className="section-subtitle">
          Discover the latest additions to the AURA collection.
        </p>
      </div>

      <div className="new-arrivals-grid">
        {cards.map((card) => (
          <Link
            key={card.id}
            to={card.link}
            className="new-arrivals-card"
            aria-label={`Explore ${card.title} - ${card.subtitle}`}
          >
            <div className="new-arrivals-card-image-wrap">
              <img
                src={card.image}
                alt={card.alt}
                className="new-arrivals-card-img"
                loading="lazy"
              />
              <div className="new-arrivals-card-overlay" />
            </div>

            <div className="new-arrivals-card-top">
              <span className="new-arrivals-pill">{card.tag}</span>
              <span className="new-arrivals-count-badge">{card.itemCountText}</span>
            </div>

            <div className="new-arrivals-card-content">
              <span className="new-arrivals-card-category">{card.category}</span>
              <h3 className="new-arrivals-card-title">{card.title}</h3>
              <p className="new-arrivals-card-desc">{card.subtitle}</p>
              <div className="new-arrivals-card-action">
                <span>Explore Collection</span>
                <ArrowRight size={15} className="new-arrivals-arrow" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
