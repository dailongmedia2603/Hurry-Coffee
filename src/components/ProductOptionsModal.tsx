import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, Topping } from '@/types';
import { supabase } from '@/src/integrations/supabase/client';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

type ProductOptionsModalProps = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, size: string, toppings: Topping[]) => void;
};

const SIZES = ['S', 'M', 'L'];

const ProductOptionsModal = ({ visible, product, onClose, onAddToCart }: ProductOptionsModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [notes, setNotes] = useState('');
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loadingToppings, setLoadingToppings] = useState(false);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedSize('M');
      setNotes('');
      setSelectedToppings([]);

      const fetchToppings = async () => {
        setLoadingToppings(true);
        const { data, error } = await supabase.from('toppings').select('*').order('price');
        if (error) {
          console.error('Error fetching toppings:', error);
        } else {
          setToppings(data || []);
        }
        setLoadingToppings(false);
      };
      fetchToppings();
    }
  }, [product]);

  if (!product) {
    return null;
  }

  const handleToggleTopping = (topping: Topping) => {
    setSelectedToppings(prev => {
      const isSelected = prev.some(t => t.id === topping.id);
      if (isSelected) {
        return prev.filter(t => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleAddToCartPress = () => {
    onAddToCart(product, quantity, selectedSize, selectedToppings);
  };

  const toppingsPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const totalPrice = (product.price + toppingsPrice) * quantity;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Image source={{ uri: product.image_url || 'https://via.placeholder.com/150' }} style={styles.productImage} />
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close-circle" size={32} color="#aaa" />
              </TouchableOpacity>
            </View>

            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>

            <View style={styles.separator} />

            <Text style={styles.sectionTitle}>Chọn size</Text>
            <View style={styles.sizeContainer}>
              {SIZES.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeOption, selectedSize === size && styles.sizeOptionSelected]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextSelected]}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Topping</Text>
            {loadingToppings ? <ActivityIndicator color="#73509c" /> : toppings.map(topping => {
                const isSelected = selectedToppings.some(t => t.id === topping.id);
                return (
                    <TouchableOpacity key={topping.id} style={styles.toppingRow} onPress={() => handleToggleTopping(topping)}>
                        <Text style={styles.toppingName}>{topping.name}</Text>
                        <Text style={styles.toppingPrice}>+{formatPrice(topping.price)}</Text>
                        <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={24} color={isSelected ? "#73509c" : "#ccc"} />
                    </TouchableOpacity>
                )
            })}

            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Thêm ghi chú cho món ăn..."
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>
          <View style={styles.footer}>
            <View style={styles.priceAndQuantity}>
              <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(q => Math.max(1, q - 1))}
                >
                  <Ionicons name="remove-circle-outline" size={32} color="#73509c" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(q => q + 1)}
                >
                  <Ionicons name="add-circle" size={32} color="#73509c" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCartPress}>
              <Text style={styles.addToCartButtonText}>Thêm vào giỏ hàng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginTop: -80,
  },
  closeButton: {
    position: 'absolute',
    top: -70,
    right: 10,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 12,
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  sizeOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  sizeOptionSelected: {
    backgroundColor: '#73509c',
    borderColor: '#73509c',
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sizeTextSelected: {
    color: '#fff',
  },
  toppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toppingName: {
    flex: 1,
    fontSize: 16,
  },
  toppingPrice: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  priceAndQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  addToCartButton: {
    backgroundColor: '#73509c',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductOptionsModal;