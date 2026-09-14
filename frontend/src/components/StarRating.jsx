import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

export default function StarRating({
  rating = 0,
  count = null,
  size = 18,
  interactive = false,
  onChange = null,
  compact = false,
  showScore = true,
  disabled = false,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
  const roundedRating = Math.round((Number(displayRating) || 0) * 10) / 10;

  const handleClick = (starValue) => {
    if (interactive && !disabled && onChange) {
      onChange(starValue);
    }
  };

  const handleMouseEnter = (starValue) => {
    if (interactive && !disabled) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (interactive && !disabled) {
      setHoverRating(0);
    }
  };

  return (
    <div
      className={`star-rating-wrap ${interactive ? 'is-interactive' : ''} ${
        compact ? 'is-compact' : ''
      } ${disabled ? 'is-disabled' : ''}`}
      onMouseLeave={handleMouseLeave}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`${roundedRating} out of 5 stars`}
    >
      <div className="star-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.round(displayRating);
          return (
            <button
              key={star}
              type="button"
              className={`star-btn ${isFilled ? 'filled' : 'empty'}`}
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              disabled={!interactive || disabled}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              role={interactive ? 'radio' : undefined}
              aria-checked={interactive ? star === rating : undefined}
              tabIndex={interactive ? 0 : -1}
            >
              <Star
                size={size}
                fill={isFilled ? 'var(--gold)' : 'none'}
                stroke={isFilled ? 'var(--gold)' : 'rgba(201, 164, 92, 0.48)'}
                strokeWidth={1.6}
              />
            </button>
          );
        })}
      </div>

      {showScore && roundedRating > 0 && (
        <span className="star-rating-score">
          {roundedRating.toFixed(1)}
        </span>
      )}

      {count !== null && count !== undefined && count > 0 && (
        <span className="star-rating-count">({count})</span>
      )}
    </div>
  );
}

