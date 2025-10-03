import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, size: string) => void;
  decreaseItem: (productId: string, size: string) => void;
  getItemQuantity: (productId: string, size: string) => number;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity: number, size: string) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === product.id && item.size === size
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        return [...prevItems, { product, quantity, size }];
      }
    });
  };

  const decreaseItem = (productId: string, size: string) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === productId && item.size === size
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        if (newItems[existingItemIndex].quantity > 1) {
          newItems[existingItemIndex].quantity -= 1;
          return newItems;
        } else {
          return newItems.filter((_, index) => index !== existingItemIndex);
        }
      }
      return prevItems;
    });
  };

  const getItemQuantity = (productId: string, size: string) => {
    const item = items.find(
      item => item.product.id === productId && item.size === size
    );
    return item ? item.quantity : 0;
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, decreaseItem, getItemQuantity, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};