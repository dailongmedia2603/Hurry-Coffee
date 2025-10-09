import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import ProductForm from '@/src/components/admin/ProductForm';
import ConfirmDeleteModal from '@/src/components/admin/ConfirmDeleteModal';
import { uploadImage } from '@/src/utils/imageUpload';

const AdminProductsScreen = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalVisible, setFormModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const router = useRouter();

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (data) setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddNew = () => {
        setSelectedProduct(null);
        setFormModalVisible(true);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormModalVisible(true);
    };

    const handleDelete = (product: Product) => {
        setDeletingProduct(product);
    };

    const confirmDelete = async () => {
        if (!deletingProduct) return;
        await supabase.from('products').delete().eq('id', deletingProduct.id);
        setDeletingProduct(null);
        fetchProducts();
    };

    const handleSave = async (formData: any) => {
        setIsSubmitting(true);
        let imageUrl = formData.image_url;
        if (imageUrl && !imageUrl.startsWith('https')) {
            imageUrl = await uploadImage(imageUrl, 'product-images');
        }

        const dataToSave = { ...formData, image_url: imageUrl };

        if (selectedProduct) {
            await supabase.from('products').update(dataToSave).eq('id', selectedProduct.id);
        } else {
            await supabase.from('products').insert(dataToSave);
        }
        setIsSubmitting(false);
        setFormModalVisible(false);
        fetchProducts();
    };

    if (loading) {
        return <ActivityIndicator style={styles.centered} size="large" />;
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Quản lý Sản phẩm',
                headerRight: () => <Pressable onPress={handleAddNew}><Ionicons name="add-circle" size={24} color="#007AFF" /></Pressable>
            }} />
            <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.productItem}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <View style={styles.actions}>
                            <Pressable onPress={() => handleEdit(item)}><Ionicons name="pencil" size={20} color="blue" /></Pressable>
                            <Pressable onPress={() => handleDelete(item)}><Ionicons name="trash" size={20} color="red" /></Pressable>
                        </View>
                    </View>
                )}
            />
            <Modal visible={isFormModalVisible} animationType="slide" onRequestClose={() => setFormModalVisible(false)}>
                <SafeAreaView>
                    <ProductForm
                        product={selectedProduct}
                        onSubmit={handleSave}
                        loading={isSubmitting}
                    />
                    <Pressable style={styles.closeButton} onPress={() => setFormModalVisible(false)}>
                        <Text style={styles.closeButtonText}>Huỷ</Text>
                    </Pressable>
                </SafeAreaView>
            </Modal>
            <ConfirmDeleteModal
                visible={!!deletingProduct}
                onClose={() => setDeletingProduct(null)}
                onConfirm={confirmDelete}
                title="Xoá sản phẩm"
                message={`Bạn có chắc chắn muốn xoá "${deletingProduct?.name || ''}"?`}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    productItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    productName: { fontSize: 16, flex: 1 },
    actions: { flexDirection: 'row', gap: 15 },
    closeButton: { padding: 15, alignItems: 'center', backgroundColor: '#eee', margin: 10, borderRadius: 5 },
    closeButtonText: { fontSize: 16, fontWeight: 'bold' },
});

export default AdminProductsScreen;