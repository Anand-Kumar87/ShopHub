'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart open/close state
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem('shophub_cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        setCartItems([]);
      }
    }
    setIsLoading(false);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        // 🔥 FIX: Added try-catch to prevent "QuotaExceededError" from crashing the site
        localStorage.setItem('shophub_cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Local Storage is full! Could not save to cart.', error);
      }
    }
  }, [cartItems, isLoading]);

  // Cart Actions
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);

      // Handle database price structure (salePrice vs regular price)
      const actualPrice = product.onSale && product.salePrice ? product.salePrice : product.price;

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        return updatedItems;
      } else {
        // 🔥 OPTIMIZATION: Only save essential data to prevent 5MB localStorage limit
        const optimizedProduct = {
          id: product.id,
          name: product.name,
          price: actualPrice,
          originalPrice: product.price,
          salePrice: product.salePrice,
          onSale: product.onSale,
          slug: product.slug,
          size: product.size,
          color: product.color,
          // Extract only the first image if it's an array to save huge amounts of space
          images: Array.isArray(product.images) && product.images.length > 0 ? [product.images[0]] : product.images,
          image: product.image,
          category: product.category,
          quantity: quantity
        };

        return [...prevItems, optimizedProduct];
      }
    });

    // Product add hote hi automatically cart slide open ho jayega
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => setCartItems(prevItems => prevItems.filter(item => item.id !== productId));

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCartItems(prevItems => prevItems.map(item => item.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCartItems([]);

  const getTotalPrice = () => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const getTotalItems = () => cartItems.reduce((total, item) => total + item.quantity, 0);

  // Cart Drawer toggle functions
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
      isLoading,
      isCartOpen,
      openCart,
      closeCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
