import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Star, User, Trash2 } from 'lucide-react';
import {
  getProduct,
  addToCart,
  getProductRatings,
  getMyRating,
  submitProductRating,
  deleteProductRating,
} from '../api';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import { formatCurrency } from '../utils/format';
import './ProductDetail.css';

export default function ProductDetail({ onCartChange }) {
  const { slug } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  // Ratings & Reviews State
  const [ratingsData, setRatingsData] = useState({
    averageRating: 0,
    totalRatings: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  });
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [myRating, setMyRating] = useState(null);
  const [formRating, setFormRating] = useState(5);
  const [formReviewText, setFormReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [deletingRating, setDeletingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState(null);
  const [ratingError, setRatingError] = useState(null);

  const { isInWishlist, toggleWishlist } = useWishlist();
  const wishlisted = product ? isInWishlist(product.id) : false;

  const loadProductRatings = useCallback(async (productId) => {
    if (!productId) return;
    setRatingsLoading(true);
    try {
      const data = await getProductRatings(productId);
      setRatingsData(data);
    } catch (err) {
      console.warn('Could not load ratings:', err);
    } finally {
      setRatingsLoading(false);
    }
  }, []);

  const loadMyRating = useCallback(async (productId) => {
    if (!productId || !user) {
      setMyRating(null);
      return;
    }
    try {
      const data = await getMyRating(productId);
      if (data && data.rating) {
        setMyRating(data);
        setFormRating(data.rating);
        setFormReviewText(data.reviewText || '');
      } else {
        setMyRating(null);
      }
    } catch (err) {
      console.warn('Could not load user rating:', err);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    setAdded(false);
    getProduct(slug)
      .then((data) => {
        setProduct(data);
        loadProductRatings(data.id);
        loadMyRating(data.id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, loadProductRatings, loadMyRating]);

  // Re-fetch my rating when user authentication state changes
  useEffect(() => {
    if (product?.id) {
      loadMyRating(product.id);
    }
  }, [user, product?.id, loadMyRating]);

  async function handleAddToCart() {
    try {
      await addToCart(product.id, quantity);
      onCartChange?.();
      setAdded(true);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRatingSubmit(e) {
    e.preventDefault();
    if (!formRating) {
      setRatingError('Please select a star rating between 1 and 5.');
      return;
    }

    setSubmittingRating(true);
    setRatingError(null);
    setRatingMessage(null);

    try {
      const res = await submitProductRating(product.id, {
        rating: formRating,
        reviewText: formReviewText,
      });
      setRatingMessage(res.message || 'Thank you! Your feedback has been recorded.');
      // Refresh ratings & user rating
      await loadProductRatings(product.id);
      await loadMyRating(product.id);
    } catch (err) {
      setRatingError(err.message || 'Unable to submit your rating.');
    } finally {
      setSubmittingRating(false);
    }
  }

  async function handleRatingDelete() {
    if (!window.confirm('Are you sure you want to remove your rating?')) return;
    setDeletingRating(true);
    setRatingError(null);
    setRatingMessage(null);

    try {
      const res = await deleteProductRating(product.id);
      setRatingMessage(res.message || 'Your review was deleted.');
      setMyRating(null);
      setFormRating(5);
      setFormReviewText('');
      await loadProductRatings(product.id);
    } catch (err) {
      setRatingError(err.message || 'Failed to remove rating.');
    } finally {
      setDeletingRating(false);
    }
  }

  if (loading) return <p className="pd-status container">Loading product…</p>;
  if (error) return <p className="pd-status pd-error container">Couldn't load product: {error}</p>;
  if (!product) return null;

  const totalRatings = ratingsData.totalRatings || 0;
  const averageRating = ratingsData.averageRating || 0;

  return (
    <div className="pd-page container">
      <p className="pd-breadcrumb">
        <Link to="/shop">Shop</Link> / {product.category_name || 'Product'}
      </p>

      <div className="pd-grid">
        <div className="pd-image-wrap">
          <img src={product.image_url} alt={product.name} className="pd-image" />
        </div>

        <div className="pd-info">
          {product.category_name && <p className="eyebrow">{product.category_name}</p>}
          <h1 className="pd-name">{product.name}</h1>

          {/* Average Rating Snippet in Hero header */}
          <div className="pd-header-rating">
            <StarRating
              rating={averageRating}
              count={totalRatings}
              size={16}
            />
            {totalRatings === 0 && (
              <span className="pd-no-ratings-hint">Be the first to rate</span>
            )}
          </div>

          <p className="pd-price">{formatCurrency(product.price)}</p>
          <p className="pd-description">{product.description}</p>

          <p className="pd-stock">
            {product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}
          </p>

          <div className="pd-actions-wrap">
            {product.stock > 0 ? (
              <div className="pd-actions">
                <div className="pd-qty">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
                </div>
                <button className="btn btn-gold pd-add-btn" onClick={handleAddToCart}>
                  Add to Cart
                </button>
                <button
                  type="button"
                  className={`btn btn-outline pd-wishlist-btn ${wishlisted ? 'active' : ''}`}
                  onClick={() => toggleWishlist(product)}
                  aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart
                    size={17}
                    fill={wishlisted ? 'var(--gold)' : 'none'}
                    stroke={wishlisted ? 'var(--gold)' : 'currentColor'}
                    aria-hidden="true"
                    focusable="false"
                  />
                  <span>{wishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>
            ) : (
              <div className="pd-actions">
                <button
                  type="button"
                  className={`btn btn-outline pd-wishlist-btn ${wishlisted ? 'active' : ''}`}
                  onClick={() => toggleWishlist(product)}
                  aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart
                    size={17}
                    fill={wishlisted ? 'var(--gold)' : 'none'}
                    stroke={wishlisted ? 'var(--gold)' : 'currentColor'}
                    aria-hidden="true"
                    focusable="false"
                  />
                  <span>{wishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>
            )}
          </div>

          {added && (
            <p className="pd-added-msg">
              Added to cart. <Link to="/cart">View cart →</Link>
            </p>
          )}
        </div>
      </div>

      {/* ========================================================
          CUSTOMER REVIEWS & RATINGS SECTION
          ======================================================== */}
      <section className="pd-reviews-section">
        <div className="pd-section-header">
          <p className="eyebrow">Client Reflections</p>
          <h2 className="pd-section-title">Customer Reviews & Ratings</h2>
        </div>

        <div className="pd-reviews-grid">
          {/* Left Column: Overall Summary & Distribution Bars */}
          <div className="pd-ratings-summary-card">
            <div className="pd-overall-score-wrap">
              <span className="pd-overall-number">
                {averageRating > 0 ? averageRating.toFixed(1) : '—'}
              </span>
              <div className="pd-overall-stars">
                <StarRating rating={averageRating} size={20} showScore={false} />
                <span className="pd-overall-count">
                  Based on {totalRatings} verified {totalRatings === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>

            <div className="pd-distribution-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingsData.distribution?.[star] || 0;
                const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                return (
                  <div key={star} className="pd-dist-row">
                    <span className="pd-dist-star-label">
                      {star} <Star size={12} fill="var(--gold)" stroke="none" />
                    </span>
                    <div className="pd-dist-bar-track">
                      <div
                        className="pd-dist-bar-fill"
                        style={{ width: `${percentage}%` }}
                        aria-valuenow={percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                    <span className="pd-dist-count">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Rate / Review Form */}
          <div className="pd-review-form-card">
            <h3 className="pd-form-heading">
              {myRating ? 'Your Review' : 'Rate This Creation'}
            </h3>
            <p className="pd-form-subhead">
              Share your thoughts on the craftsmanship, finish, and experience of this piece.
            </p>

            {ratingMessage && <div className="pd-form-alert pd-alert-success">{ratingMessage}</div>}
            {ratingError && <div className="pd-form-alert pd-alert-error">{ratingError}</div>}

            {!user ? (
              <div className="pd-auth-gate">
                <p className="pd-auth-gate-text">
                  To ensure authentic testimonials, please sign in with your AURA client account to share your review.
                </p>
                <Link to="/login" className="btn btn-gold pd-login-btn">
                  Sign In to Rate
                </Link>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="pd-rating-form">
                <div className="pd-form-group">
                  <label className="pd-form-label">Your Rating *</label>
                  <div className="pd-star-picker">
                    <StarRating
                      rating={formRating}
                      onChange={setFormRating}
                      interactive={true}
                      size={26}
                      showScore={false}
                    />
                    <span className="pd-star-selected-text">
                      {formRating} of 5 Stars
                    </span>
                  </div>
                </div>

                <div className="pd-form-group">
                  <label htmlFor="pdReviewText" className="pd-form-label">
                    Your Review & Feedback (Optional)
                  </label>
                  <textarea
                    id="pdReviewText"
                    rows={4}
                    value={formReviewText}
                    onChange={(e) => setFormReviewText(e.target.value)}
                    placeholder="Describe the fit, luster, packaging, and any impression of the piece..."
                    className="pd-textarea"
                    maxLength={1000}
                  />
                  <span className="pd-char-count">{formReviewText.length} / 1000 characters</span>
                </div>

                <div className="pd-form-actions">
                  <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={submittingRating || deletingRating}
                  >
                    {submittingRating
                      ? 'Saving Feedback…'
                      : myRating
                      ? 'Update Your Review'
                      : 'Submit Review'}
                  </button>

                  {myRating && (
                    <button
                      type="button"
                      className="pd-delete-review-btn"
                      onClick={handleRatingDelete}
                      disabled={submittingRating || deletingRating}
                      title="Remove your review"
                    >
                      <Trash2 size={16} />
                      <span>{deletingRating ? 'Deleting…' : 'Delete Review'}</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Existing Customer Reviews Testimonials List */}
        <div className="pd-reviews-list-wrap">
          <h3 className="pd-reviews-list-heading">
            Verified Customer Reviews ({ratingsData.reviews.length})
          </h3>

          {ratingsLoading ? (
            <p className="pd-reviews-loading">Loading customer impressions…</p>
          ) : ratingsData.reviews.length === 0 ? (
            <div className="pd-no-reviews-box">
              <p className="pd-no-reviews-title">No client reviews yet.</p>
              <p className="pd-no-reviews-desc">
                Be the first to share your impression of this exquisite creation.
              </p>
            </div>
          ) : (
            <div className="pd-reviews-list">
              {ratingsData.reviews.map((rev) => (
                <div key={rev.id} className="pd-review-item">
                  <div className="pd-review-header">
                    <div className="pd-reviewer-meta">
                      <div className="pd-avatar">
                        {rev.customer_name ? rev.customer_name.charAt(0).toUpperCase() : <User size={14} />}
                      </div>
                      <div>
                        <h4 className="pd-reviewer-name">{rev.customer_name}</h4>
                        <span className="pd-review-date">
                          {new Date(rev.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pd-review-stars">
                      <StarRating rating={rev.rating} size={14} showScore={false} />
                    </div>
                  </div>

                  {rev.review_text && (
                    <p className="pd-review-content">{rev.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}