import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import './Hero.css';

export default function Hero({ products = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  // If no products available at all, do not render an empty container
  if (!products || products.length === 0) {
    return null;
  }

  // Construct slides 100% dynamically from database-managed products
  const slides = products.map((prod, idx) => {
    const categoryLabel = prod.category_name || (prod.category_slug ? prod.category_slug.toUpperCase() : 'FINE JEWELLERY');
    const ctaText = `SHOP ${categoryLabel.toUpperCase()}`;
    const ctaLink = prod.category_slug
      ? `/shop?category=${prod.category_slug}`
      : (prod.slug ? `/product/${prod.slug}` : '/shop');

    const rawEyebrow = prod.occasion_tags
      ? prod.occasion_tags.split(',')[0].trim().toUpperCase()
      : (prod.gender_tag ? `${prod.gender_tag.toUpperCase()} COLLECTION` : 'SIGNATURE PIECE');

    return {
      id: prod.id || idx + 1,
      eyebrow: rawEyebrow,
      title: prod.name,
      subtitle: (prod.description && prod.description.trim())
        ? prod.description.trim()
        : 'Handcrafted fine jewellery sculpted for timeless distinction.',
      image: prod.image_url || 'https://placehold.co/1000x800/1a1815/d4af37?text=AURA',
      price: prod.price,
      ctaText,
      ctaLink,
    };
  });

  const totalSlides = slides.length;
  const activeIndex = currentIndex % totalSlides;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-slide effect (interval 3.5s), pauses on hover or touch if multiple slides exist
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      goToNext();
    } else if (diff < -50) {
      goToPrev();
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  return (
    <section
      className="hero"
      aria-label="Jewellery Showcase Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="hero-glow" />

      {/* Slide Track */}
      <div
        className="hero-slider-track"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === activeIndex ? 'is-active' : ''}`}
            aria-hidden={index !== activeIndex}
          >
            <div className="hero-inner container">
              <div className="hero-copy">
                <span className="eyebrow">{slide.eyebrow}</span>
                <h1 className="hero-title">{slide.title}</h1>
                <p className="hero-subtitle">{slide.subtitle}</p>

                <div className="hero-cta-row">
                  <Link to={slide.ctaLink} className="btn btn-gold">
                    {slide.ctaText}
                  </Link>
                  {slide.price !== undefined && slide.price !== null && (
                    <span className="hero-price">
                      {formatCurrency(slide.price)}
                    </span>
                  )}
                </div>
              </div>

              <div className="hero-stage">
                <div className="hero-pedestal" />
                <div className="hero-img-wrapper">
                  <img
                    className="hero-product-img"
                    src={slide.image}
                    alt={slide.title}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows (rendered only if multiple slides exist) */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            className="hero-nav-btn hero-nav-prev"
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            className="hero-nav-btn hero-nav-next"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Slide Indicators */}
          <div className="hero-indicators" role="tablist" aria-label="Hero slider pagination">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
                className={`hero-indicator-dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}