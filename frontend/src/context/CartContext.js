import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('tvm-travel-cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tvm-travel-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (place) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === place.id);
      if (exists) {
        return prev;
      }
      return [...prev, place];
    });
  };

  const removeFromCart = (placeId) => {
    setCart((prev) => prev.filter((p) => p.id !== placeId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (placeId) => {
    return cart.some((p) => p.id === placeId);
  };

  const totalCost = cart.reduce((sum, place) => sum + place.cost, 0);
  const totalDuration = cart.reduce((sum, place) => sum + place.duration, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        totalCost,
        totalDuration,
        cartCount: cart.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};