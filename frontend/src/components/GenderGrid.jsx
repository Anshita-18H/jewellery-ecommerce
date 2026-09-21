import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './GenderGrid.css';

const GENDERS = [
  {
    id: 'women',
    title: 'Women Jewellery',
    tag: 'Grace & Radiance',
    description: 'Timeless designs sculpted to illuminate every facet of elegance',
    image: 'https://images.unsplash.com/photo-1688382654723-a7366006519b?w=800&auto=format&fit=crop&q=80',
    link: '/shop?gender=women',
    actionText: 'Shop Women',
  },
  {
    id: 'men',
    title: 'Men Jewellery',
    tag: 'Bold & Refined',
    description: 'Distinctive rings, chains, and bracelets crafted with subtle strength',
    image: 'https://images.unsplash.com/photo-1613498510372-8901cad084a2?w=800&auto=format&fit=crop&q=80',
    link: '/shop?gender=men',
    actionText: 'Shop Men',
  },
  {
    id: 'kids',
    title: 'Kids Jewellery',
    tag: 'Gentle Keepsakes',
    description: 'Precious heirloom charms and bracelets in pure hypoallergenic gold',
    image: 'https://placehold.co/800x800/1b1712/c9a876?text=Kids+Jewellery',
    link: '/shop?gender=kids',
    actionText: 'Shop Kids',
  },
];

export default function GenderGrid() {
  return (
    <section className="gender-section container" aria-label="Shop By Gender">
      <div className="home-section-header text-center">
        <p className="eyebrow">Curated For You</p>
        <h2 className="section-title">Shop By Gender</h2>
        <p className="section-subtitle">
          Exquisite fine jewellery tailored for women, men, and children
        </p>
      </div>

      <div className="gender-grid">
        {GENDERS.map((item) => (
          <Link
            key={item.id}
            to={item.link}
            className="gender-card"
            aria-label={`Shop ${item.title}`}
          >
            <div className="gender-card-image-wrap">
              <img
                src={item.image}
                alt={item.title}
                className="gender-card-img"
                loading="lazy"
              />
              <div className="gender-card-overlay" />
            </div>

            <div className="gender-card-content">
              <span className="gender-card-tag">{item.tag}</span>
              <h3 className="gender-card-title">{item.title}</h3>
              <p className="gender-card-desc">{item.description}</p>
              <div className="gender-card-action">
                <span>{item.actionText}</span>
                <ArrowRight size={15} className="gender-arrow" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

