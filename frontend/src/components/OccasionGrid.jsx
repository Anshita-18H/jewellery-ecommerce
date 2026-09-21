import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './OccasionGrid.css';

const OCCASIONS = [
  {
    id: 'bridal',
    title: 'Bridal Edit',
    tag: 'Heirloom Elegance',
    description: 'Regal masterpieces sculpted for your unforgettable celebrations',
    image: 'https://images.unsplash.com/photo-1600862754152-80a263dd564f?w=800&auto=format&fit=crop&q=80',
    link: '/shop?category=bridal',
    actionText: 'Explore Bridal',
  },
  {
    id: 'gifting',
    title: 'Gifting Jewellery',
    tag: 'Cherished Moments',
    description: 'Thoughtfully curated treasures to mark timeless milestones',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
    link: '/shop?occasion=gifting',
    actionText: 'Explore Gifting',
  },
  {
    id: 'everyday',
    title: 'Everyday Wear',
    tag: 'Daily Distinction',
    description: 'Understated brilliance designed for everyday effortless luxury',
    image: 'https://images.unsplash.com/photo-1623321673989-830eff0fd59f?w=800&auto=format&fit=crop&q=80',
    link: '/shop?occasion=everyday',
    actionText: 'Explore Everyday',
  },
];

export default function OccasionGrid() {
  return (
    <section className="occasion-section container">
      <div className="home-section-header text-center">
        <p className="eyebrow">Curated Moments</p>
        <h2 className="section-title">Shop by Occasion</h2>
        <p className="section-subtitle">
          Exquisite fine jewellery curated for life’s celebrated milestones and daily rituals
        </p>
      </div>

      <div className="occasion-grid">
        {OCCASIONS.map((occ) => (
          <Link
            key={occ.id}
            to={occ.link}
            className="occasion-card"
            aria-label={`Shop ${occ.title}`}
          >
            <div className="occasion-card-image-wrap">
              <img
                src={occ.image}
                alt={occ.title}
                className="occasion-card-img"
                loading="lazy"
              />
              <div className="occasion-card-overlay" />
            </div>

            <div className="occasion-card-content">
              <span className="occasion-card-tag">{occ.tag}</span>
              <h3 className="occasion-card-title">{occ.title}</h3>
              <p className="occasion-card-desc">{occ.description}</p>
              <div className="occasion-card-action">
                <span>{occ.actionText}</span>
                <ArrowRight size={15} className="occasion-arrow" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

