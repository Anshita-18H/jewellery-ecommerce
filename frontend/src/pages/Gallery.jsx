import './Gallery.css';

const galleryImages = [
  { src: 'https://placehold.co/600x750/1b1712/c9a876?text=Look+01', caption: 'The Radiance Edit' },
  { src: 'https://placehold.co/600x750/1b1712/c9a876?text=Look+02', caption: 'Bridal Story' },
  { src: 'https://placehold.co/600x750/1b1712/c9a876?text=Look+03', caption: 'Everyday Gold' },
  { src: 'https://placehold.co/600x750/1b1712/c9a876?text=Look+04', caption: 'Kundan Heritage' },
  { src: 'https://placehold.co/600x750/1b1712/c9a876?text=Look+05', caption: 'Studio Portraits' },
  { src: 'https://placehold.co/600x750/1b1712/c9a876?text=Look+06', caption: 'The Aura Campaign' },
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