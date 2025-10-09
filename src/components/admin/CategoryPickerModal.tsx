import React from 'react';
import { Modal, View, Text, FlatList, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCategory } from '@/types';

type CategoryPickerModalProps = {
    visible: boolean;
    onClose: () => void;
    onSelect: (category: ProductCategory) => void;
    categories: ProductCategory[];
};

const CategoryPickerModal = ({ visible, onClose, onSelect, categories }: CategoryPickerModalProps) => {
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Chọn Phân loại</Text>
                <FlatList
                    data={categories}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Pressable style={styles.itemContainer} onPress={() => onSelect(item)}>
                            <Ionicons name={(item.icon_name as any) || 'help-circle-outline'} size={24} color="black" />
                            <Text style={styles.itemText}>{item.name}</Text>
                        </Pressable>
                    )}
                />
                <Pressable style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>Đóng</Text>
                </Pressable>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    itemText: { fontSize: 18, marginLeft: 10 },
    closeButton: { backgroundColor: 'gray', padding: 15, alignItems: 'center', margin: 20, borderRadius: 5 },
    closeButtonText: { color: 'white', fontWeight: 'bold' },
});

export default CategoryPickerModal;