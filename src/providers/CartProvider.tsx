import { createContext, useContext, useState } from 'react';
import { CartItem, Product } from '@/types';
import * as Crypto from 'expo-crypto';
import React from 'react';

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product) => void;
  updateQuantity: (itemId: string, amount: -1 | 1) => void;
  total: number;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  updateQuantity: () => {},
  total: 0,
  clearCart: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product) => {
    const existingItem = items.find(item => item.product.id === product.id);
    if (existingItem) {
      updateQuantity(existingItem.id, 1);
    } else {
      const newCartItem: CartItem = {
        id: Crypto.randomUUID(),
        product,
        quantity: 1,
      };
      setItems([newCartItem, ...items]);
    }
  };

  const updateQuantity = (itemId: string, amount: -1 | 1) => {
    setItems(
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: item.quantity + amount }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const total = items.reduce((sum, item) => (sum += item.product.price * item.quantity), 0);

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, total, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);