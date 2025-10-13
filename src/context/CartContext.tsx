import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Product, Topping } from '@/types';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  size: { name: string; price: number };
  toppings: Topping[];
  options: string[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, size: { name: string; price: number }, toppings: Topping[], options: string[]) => void;
  decreaseItem: (itemId: string) => void;
  decreaseLastAddedItemForProduct: (productId: string) => void;
  clearCart: () => void;
  getProductQuantity: (productId: string) => number;
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

  const addItem = (product: Product, quantity: number, size: { name: string; price: number }, toppings: Topping[], options: string[]) => {
    setItems(prevItems => {
      const toppingsKey = toppings.map(t => t.id).sort().join(',');
      const optionsKey = options.sort().join(',');
      const itemId = `${product.id}-${size.name}-${toppingsKey}-${optionsKey}`;

      const existingItemIndex = prevItems.findIndex(item => item.id === itemId);

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        return [...prevItems, { id: itemId, product, quantity, size, toppings, options }];
      }
    });
  };

  const decreaseItem = (itemId: string) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const existingItemIndex = newItems.findIndex(item => item.id === itemId);

      if (existingItemIndex > -1) {
        if (newItems[existingItemIndex].quantity > 1) {
          newItems[existingItemIndex].quantity -= 1;
        } else {
          newItems.splice(existingItemIndex, 1);
        }
        return newItems;
      }
      return prevItems;
    });
  };

  const decreaseLastAddedItemForProduct = (productId: string) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const lastItemVariantIndex = newItems.findLastIndex(item => item.product.id === productId);

      if (lastItemVariantIndex > -1) {
        if (newItems[lastItemVariantIndex].quantity > 1) {
          newItems[lastItemVariantIndex].quantity -= 1;
        } else {
          newItems.splice(lastItemVariantIndex, 1);
        }
        return newItems;
      }
      return prevItems;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const getProductQuantity = (productId: string) => {
    return items
      .filter(item => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalPrice = items.reduce((sum, item) => {
    const toppingsPrice = item.toppings.reduce((toppingSum, topping) => toppingSum + topping.price, 0);
    const itemPrice = item.size.price + toppingsPrice;
    return sum + itemPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, decreaseItem, decreaseLastAddedItemForProduct, clearCart, getProductQuantity, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};