import { Link } from 'react-router-dom';
import './GalleryBanner.css';

export default function GalleryBanner({
  image = 'https://placehold.co/1200x600/1b1712/c9a876?text=The+Aura+Campaign',
  title = 'The Aura Campaign',
  linkTo = '/gallery',
}) {
  return (
    <section className="gallery-banner-section container">
      <p className="eyebrow gallery-banner-eyebrow">Luxury Gallery</p>
      <Link to={linkTo} className="gallery-banner" style={{ backgroundImage: `url(${image})` }}>
        <div className="gallery-banner-overlay">
          <h3 className="gallery-banner-title">{title}</h3>
          <span className="gallery-banner-link">Explore More</span>
        </div>
      </Link>
    </section>
  );
}