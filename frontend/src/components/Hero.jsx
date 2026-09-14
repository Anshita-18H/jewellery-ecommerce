import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { heroSlides } from '../data/heroSlides';
import './Hero.css';

export default function Hero({ product }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  // Combine data-driven slides with hero product if provided
  const slides = heroSlides.map((slide, idx) => {
    if (idx === 0 && product) {
      return {
        ...slide,
        image: product.image_url || slide.image,
        price: product.price,
      };
    }
    return slide;
  });

  const totalSlides = slides.length;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-slide effect (interval 5.5s), pauses on hover or touch
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      goToNext();
    }, 5500);

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
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentIndex ? 'is-active' : ''}`}
            aria-hidden={index !== currentIndex}
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
                  {slide.price && (
                    <span className="hero-price">
                      Rs. {Number(slide.price).toLocaleString()}
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

      {/* Navigation Arrows */}
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
            aria-selected={index === currentIndex}
            aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            className={`hero-indicator-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}