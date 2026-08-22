import './Gallery.css';
const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1551811040-f13e57351ef3?w=600&h=750&auto=format&fit=crop&q=80', caption: 'The Radiance Edit' },
  { src: 'https://images.unsplash.com/photo-1742891603547-950f510710d7?w=600&h=750&auto=format&fit=crop&q=80', caption: 'Bridal Story' },
  { src: 'https://images.unsplash.com/photo-1599481805056-1c61a8975797?w=600&h=750&auto=format&fit=crop&q=80', caption: 'Everyday Gold' },
  { src: 'https://images.unsplash.com/photo-1680968921717-4abbbe793bb3?w=600&h=750&auto=format&fit=crop&q=80', caption: 'Kundan Heritage' },
  { src: 'https://images.unsplash.com/photo-1654699991520-aaaf4dd2608b?w=600&h=750&auto=format&fit=crop&q=80', caption: 'Studio Portraits' },
  { src: 'https://images.unsplash.com/photo-1758995115682-1452a1a9e35b?w=600&h=750&auto=format&fit=crop&q=80', caption: 'The Aura Campaign' },
];

export default function Gallery() {
  return (
    <div className="gallery-page container">
      <div className="gallery-page-header">
        <p className="eyebrow">Lookbook</p>
        <h1 className="gallery-page-title">Luxury Gallery</h1>
        <p className="gallery-page-subtitle">
          A closer look at the craftsmanship, settings, and stories behind each piece.
        </p>
      </div>

      <div className="gallery-page-grid">
        {galleryImages.map((img, i) => (
          <figure key={i} className="gallery-page-item">
            <img src={img.src} alt={img.caption} />
            <figcaption>{img.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}