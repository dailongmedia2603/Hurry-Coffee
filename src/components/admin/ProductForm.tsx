import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/src/integrations/supabase/client';
import { Product, ProductCategory } from '@/types';
import CategoryPickerModal from './CategoryPickerModal';

type ProductFormProps = {
    product?: Product | null;
    onSubmit: (data: any) => void;
    loading: boolean;
};

const ProductForm = ({ product, onSubmit, loading }: ProductFormProps) => {
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [description, setDescription] = useState(product?.description || '');
    const [category, setCategory] = useState<ProductCategory | null>(null);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [image, setImage] = useState(product?.image_url || null);
    const [isCategoryPickerVisible, setCategoryPickerVisible] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('product_categories').select('*');
            if (data) setCategories(data);
        };
        fetchCategories();

        if (product?.category) {
            supabase.from('product_categories').select('*').eq('name', product.category).single().then(({ data }) => {
                if (data) setCategory(data);
            });
        }
    }, [product]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const validate = () => {
        if (!name || !price || !category) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tên, giá và phân loại.');
            return false;
        }
        return true;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            name,
            price: parseFloat(price),
            description,
            category: category?.name,
            image_url: image,
        });
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={pickImage}>
                <Image
                    source={image ? { uri: image } : require('@/assets/images/placeholder.png')}
                    style={styles.image}
                />
                <Text style={styles.selectImageText}>Chọn ảnh</Text>
            </Pressable>

            <TextInput value={name} onChangeText={setName} placeholder="Tên sản phẩm" style={styles.input} />
            <TextInput value={price} onChangeText={setPrice} placeholder="Giá" style={styles.input} keyboardType="numeric" />
            <TextInput value={description} onChangeText={setDescription} placeholder="Mô tả" style={[styles.input, styles.multilineInput]} multiline />

            <Pressable style={styles.pickerButton} onPress={() => setCategoryPickerVisible(true)}>
                <Text style={styles.pickerButtonText}>{category ? category.name : 'Chọn phân loại'}</Text>
            </Pressable>

            <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Đang xử lý...' : (product ? 'Cập nhật' : 'Thêm mới')}</Text>
            </Pressable>

            <CategoryPickerModal
                visible={isCategoryPickerVisible}
                onClose={() => setCategoryPickerVisible(false)}
                onSelect={(cat) => {
                    setCategory(cat);
                    setCategoryPickerVisible(false);
                }}
                categories={categories}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 10 },
    image: { width: 150, height: 150, borderRadius: 10, alignSelf: 'center', backgroundColor: '#eee' },
    selectImageText: { textAlign: 'center', color: '#007AFF', marginVertical: 10 },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 5, marginVertical: 5, fontSize: 16 },
    multilineInput: { height: 100, textAlignVertical: 'top' },
    pickerButton: { backgroundColor: 'white', padding: 15, borderRadius: 5, marginVertical: 5 },
    pickerButtonText: { fontSize: 16 },
    button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { backgroundColor: '#A9A9A9' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default ProductForm;