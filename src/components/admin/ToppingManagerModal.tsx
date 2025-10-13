import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Topping } from '@/types';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const formatCurrency = (value: string) => {
  if (!value) return '';
  const num = value.replace(/[^\d]/g, '');
  if (num === '' || isNaN(parseInt(num, 10))) return '';
  return new Intl.NumberFormat('vi-VN').format(parseInt(num, 10));
};

const parseCurrency = (value: string) => {
  return value.replace(/[^\d]/g, '');
};

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

type ToppingManagerModalProps = {
  visible: boolean;
  onClose: () => void;
};

const ToppingManagerModal = ({ visible, onClose }: ToppingManagerModalProps) => {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newToppingName, setNewToppingName] = useState('');
  const [newToppingPrice, setNewToppingPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [editingTopping, setEditingTopping] = useState<(Omit<Topping, 'price'> & { price: string }) | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchToppings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('toppings').select('*').order('name', { ascending: true });
    if (error) {
      showAlert('Lỗi', 'Không thể tải danh sách topping.');
    } else {
      setToppings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { if (visible) fetchToppings(); }, [visible]);

  const handleAddTopping = async () => {
    if (!newToppingName.trim() || !newToppingPrice.trim()) return;
    setIsAdding(true);
    const price = parseFloat(parseCurrency(newToppingPrice));
    const { error } = await supabase.from('toppings').insert({ name: newToppingName.trim(), price });
    if (error) {
      showAlert('Lỗi', 'Không thể thêm topping mới. Có thể tên đã tồn tại.');
    } else {
      setNewToppingName('');
      setNewToppingPrice('');
      await fetchToppings();
    }
    setIsAdding(false);
  };

  const handleDeleteTopping = (id: string) => {
    setItemToDelete(id);
    setConfirmModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('toppings').delete().eq('id', itemToDelete);
    if (error) showAlert('Lỗi', 'Không thể xóa topping. Có thể topping này đang được sử dụng trong sản phẩm.');
    else await fetchToppings();
    setConfirmModalVisible(false);
    setItemToDelete(null);
  };

  const handleStartEdit = (topping: Topping) => {
    const { price, ...rest } = topping;
    setEditingTopping({ ...rest, price: formatCurrency(price.toString()) });
  };
  const handleCancelEdit = () => setEditingTopping(null);

  const handleUpdateTopping = async () => {
    if (!editingTopping || !editingTopping.name.trim() || !editingTopping.price.trim()) return;
    setIsUpdating(true);
    const price = parseFloat(parseCurrency(editingTopping.price));
    const { error } = await supabase.from('toppings').update({ name: editingTopping.name.trim(), price }).eq('id', editingTopping.id);
    if (error) {
      showAlert('Lỗi', 'Không thể cập nhật topping. Tên có thể đã tồn tại.');
    } else {
      handleCancelEdit();
      await fetchToppings();
    }
    setIsUpdating(false);
  };

  const renderToppingItem = ({ item }: { item: Topping }) => {
    const isEditing = editingTopping?.id === item.id;
    if (isEditing) {
      return (
        <View style={[styles.itemRow, styles.editingItem]}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={editingTopping.name}
            onChangeText={(text) => setEditingTopping(t => t ? { ...t, name: text } : null)}
            autoFocus={true}
          />
          <TextInput
            style={[styles.input, { width: 100, marginLeft: 8 }]}
            value={editingTopping.price}
            onChangeText={(text) => setEditingTopping(t => t ? { ...t, price: formatCurrency(text) } : null)}
            keyboardType="numeric"
          />
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={handleUpdateTopping} disabled={isUpdating} style={styles.actionButton}>
              {isUpdating ? <ActivityIndicator size="small" /> : <Ionicons name="checkmark-circle" size={24} color="#16a34a" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.actionButton}>
              <Ionicons name="close-circle" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.itemRow}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{formatCurrency(item.price.toString())}đ</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => handleStartEdit(item)} style={styles.actionButton}><Ionicons name="pencil" size={22} color="#3b82f6" /></TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteTopping(item.id)} style={styles.actionButton}><Ionicons name="trash-outline" size={22} color="#ef4444" /></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}><Text style={styles.headerTitle}>Quản lý Topping</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity></View>
          <View style={styles.addForm}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Tên topping mới" value={newToppingName} onChangeText={setNewToppingName} />
            <TextInput style={[styles.input, { width: 100, marginLeft: 8 }]} placeholder="Giá" value={newToppingPrice} onChangeText={(text) => setNewToppingPrice(formatCurrency(text))} keyboardType="numeric" />
            <TouchableOpacity style={styles.addButton} onPress={handleAddTopping} disabled={isAdding}>{isAdding ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="add" size={24} color="#fff" />}</TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator size="large" color="#73509c" style={{ marginTop: 20 }} /> : <FlatList data={toppings} keyExtractor={(item) => item.id} renderItem={renderToppingItem} contentContainerStyle={{ paddingTop: 10 }} />}
        </View>
      </View>
      <ConfirmDeleteModal visible={isConfirmModalVisible} onClose={() => { setConfirmModalVisible(false); setItemToDelete(null); }} onConfirm={confirmDelete} title="Xóa topping" message="Bạn có chắc chắn muốn xóa topping này? Hành động này không thể hoàn tác." />
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '70%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    addForm: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, fontSize: 16 },
    addButton: { backgroundColor: '#73509c', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    itemName: { fontSize: 16, flex: 1 },
    itemPrice: { fontSize: 16, color: '#16a34a', fontWeight: '500' },
    actionsContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
    actionButton: { paddingHorizontal: 8 },
    editingItem: { paddingVertical: 8 },
});

export default ToppingManagerModal;