'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'skillpulse_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error('Failed to parse cart from localStorage:', err);
    } finally {
      setMounted(true);
    }
  }, []);

  // Sync to localStorage whenever cart changes
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (err) {
        console.error('Failed to save cart to localStorage:', err);
      }
    }
  }, [cart, mounted]);

  const addToCart = (course) => {
    if (!course || !course._id) return;
    setCart((prev) => {
      const exists = prev.some((item) => String(item._id) === String(course._id));
      if (exists) return prev;
      return [
        ...prev,
        {
          _id: course._id,
          title: course.title,
          slug: course.slug || course._id,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price ?? 0,
          originalPrice: course.originalPrice ?? 0,
          isOfferActive: Boolean(course.isOfferActive),
          offerExpiresAt: course.offerExpiresAt || null,
          offerBadgeText: course.offerBadgeText || 'Special Offer',
          level: course.level || 'beginner',
          category: course.category || 'General',
          rating: course.rating || 4.8,
          reviewsCount: course.reviewsCount || 0,
          instructor: course.instructor ? {
            _id: course.instructor._id,
            name: course.instructor.name,
            avatar: course.instructor.avatar,
            headline: course.instructor.headline,
          } : null,
          addedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const removeFromCart = (courseId) => {
    setCart((prev) => prev.filter((item) => String(item._id) !== String(courseId)));
  };

  const isInCart = (courseId) => {
    if (!courseId) return false;
    return cart.some((item) => String(item._id) === String(courseId));
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (err) {}
  };

  const cartCount = cart.length;
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const cartOriginalTotal = cart.reduce((sum, item) => sum + (Number(item.originalPrice || item.price) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        cartOriginalTotal,
        addToCart,
        removeFromCart,
        isInCart,
        clearCart,
        mounted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
