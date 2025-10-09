import { supabase } from '@/src/integrations/supabase/client';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

/**
 * Tải một file ảnh lên Supabase Storage.
 * @param uri Đường dẫn file cục bộ của ảnh (ví dụ: từ ImagePicker).
 * @param bucket Tên của bucket lưu trữ trên Supabase.
 * @returns URL công khai của ảnh đã tải lên, hoặc null nếu có lỗi.
 */
export const uploadImage = async (uri: string, bucket: string): Promise<string | null> => {
  // Bỏ qua nếu URI không phải là file cục bộ hoặc đã là URL
  if (!uri.startsWith('file://')) {
    return uri;
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExt = uri.split('.').pop() || 'jpeg';
    const filePath = `${new Date().getTime()}.${fileExt}`;
    const contentType = `image/${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, decode(base64), { contentType });

    if (error) {
      console.error('Supabase upload error:', error.message);
      throw error;
    }

    if (data) {
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return publicUrl;
    }

    return null;
  } catch (e) {
    console.error('Error uploading image:', e);
    return null;
  }
};