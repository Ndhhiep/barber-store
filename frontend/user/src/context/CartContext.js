import React, { createContext, useState, useEffect, useContext } from 'react';
import cartService from '../services/cartService';

// Create the Cart Context
const CartContext = createContext();

// Create a custom hook to use the cart context
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  
  // Load cart items from localStorage on initial render
  useEffect(() => {
    const storedCart = cartService.getCart();
    setCartItems(storedCart);
  }, []);
  
  // Save cart items to localStorage whenever cartItems changes
  useEffect(() => {
    cartService.saveCart(cartItems);
  }, [cartItems]);
  
  // Add product to cart
  const addToCart = (product) => {
    setCartItems(prevItems => {
      // Check if product already exists in cart
      const existingItem = prevItems.find(item => item.product._id === product._id);
      
      if (existingItem) {
        // If exists, increase quantity
        return prevItems.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // If new, add to cart with quantity 1
        return [...prevItems, { product, quantity: 1 }];
      }
    });
  };
  
  // Remove product from cart
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.product._id !== productId));
  };
  
  // Update product quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return; // Don't allow quantities less than 1
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.product._id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    cartService.clearCart();
  };
  
  // Calculate total items in cart
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  // Calculate total cost
  const totalCost = cartItems.reduce(
    (total, item) => total + (item.product.price * item.quantity), 
    0
  );
  
  // Context value to be provided
  const contextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    totalCost
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;