import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getWishlist,
  addToWishlistApi,
  removeFromWishlistApi,
  clearWishlistApi,
} from '../api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, openAuthModal } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync wishlist whenever user changes (login, logout, initial load)
  useEffect(() => {
    // Purge any legacy client-side localStorage
    try {
      localStorage.removeItem('aura_wishlist');
    } catch {
      // Ignore
    }

    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    getWishlist()
      .then((items) => {
        if (isMounted) {
          setWishlistItems(Array.isArray(items) ? items : []);
        }
      })
      .catch((err) => {
        console.warn('Could not load user wishlist:', err);
        if (isMounted) {
          setWishlistItems([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Toast timer cleanup
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
  }, []);

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId || !user) return false;
      return wishlistItems.some((item) => String(item.id) === String(productId));
    },
    [wishlistItems, user]
  );

  const addToWishlist = useCallback(
    async (product) => {
      if (!product || !product.id) return;

      // Gate behind login — if not logged in, prompt user and complete after auth
      if (!user) {
        openAuthModal({
          mode: 'login',
          prompt: 'Please sign in or create an account to save pieces to your wishlist.',
          onSuccess: async () => {
            try {
              await addToWishlistApi(product.id);
              const fresh = await getWishlist();
              setWishlistItems(Array.isArray(fresh) ? fresh : []);
              showToast(`Added ${product.name} to wishlist`);
            } catch (err) {
              console.error('Pending wishlist add error:', err);
            }
          },
        });
        return;
      }

      const cleanProduct = {
        id: product.id,
        name: product.name || 'Fine Jewellery Piece',
        slug: product.slug || String(product.id),
        price: product.price || 0,
        image_url: product.image_url || '',
        category_name: product.category_name || '',
        stock: typeof product.stock === 'number' ? product.stock : 1,
        description: product.description || '',
      };

      // Optimistic update
      setWishlistItems((prev) => {
        if (prev.some((item) => String(item.id) === String(product.id))) return prev;
        return [cleanProduct, ...prev];
      });
      showToast('Added to your wishlist');

      try {
        await addToWishlistApi(product.id);
      } catch (err) {
        // Rollback on failure
        setWishlistItems((prev) => prev.filter((item) => String(item.id) !== String(product.id)));
        showToast(err.message || 'Could not update wishlist');
      }
    },
    [user, openAuthModal, showToast]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!productId || !user) return;

      const previousItems = wishlistItems;
      // Optimistic update
      setWishlistItems((prev) => prev.filter((item) => String(item.id) !== String(productId)));
      showToast('Removed from your wishlist');

      try {
        await removeFromWishlistApi(productId);
      } catch (err) {
        // Rollback on failure
        setWishlistItems(previousItems);
        showToast(err.message || 'Could not remove from wishlist');
      }
    },
    [user, wishlistItems, showToast]
  );

  const toggleWishlist = useCallback(
    (product) => {
      if (!product || !product.id) return;
      if (!user) {
        openAuthModal({
          mode: 'login',
          prompt: 'Please sign in or create an account to save pieces to your wishlist.',
          onSuccess: async () => {
            try {
              await addToWishlistApi(product.id);
              const fresh = await getWishlist();
              setWishlistItems(Array.isArray(fresh) ? fresh : []);
              showToast(`Added ${product.name} to wishlist`);
            } catch (err) {
              console.error('Pending wishlist add error:', err);
            }
          },
        });
        return;
      }

      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    },
    [user, openAuthModal, isInWishlist, removeFromWishlist, addToWishlist, showToast]
  );

  const clearWishlist = useCallback(async () => {
    if (!user) return;
    const previousItems = wishlistItems;
    setWishlistItems([]);

    try {
      await clearWishlistApi();
    } catch (err) {
      setWishlistItems(previousItems);
      showToast(err.message || 'Could not clear wishlist');
    }
  }, [user, wishlistItems, showToast]);

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        toastMessage,
        showToast,
        loading,
      }}
    >
      {children}
      {toastMessage && (
        <div className="aura-toast" role="status" aria-live="polite">
          <span className="aura-toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
