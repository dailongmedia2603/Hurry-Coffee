import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { supabase } from '@/src/integrations/supabase/client';

type ImportProductsModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const ImportProductsModal = ({ visible, onClose, onSuccess }: ImportProductsModalProps) => {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setLoading(false);
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        name: 'Cà phê sữa đá',
        description: 'Cà phê đậm đà kết hợp với sữa đặc ngọt ngào.',
        category: 'Coffee',
        price: 25000,
        sizes: '[{"name": "M", "price": 25000}, {"name": "L", "price": 30000}]',
        available_options: 'Ít ngọt, Nhiều đá, Đá riêng',
      },
      {
        name: 'Trà sữa trân châu',
        description: 'Trà sữa béo ngậy cùng trân châu dai ngon.',
        category: 'Trà Sữa',
        price: 35000,
        sizes: '[{"name": "M", "price": 35000}]',
        available_options: '70% đường, 50% đường, 100% đá',
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sản phẩm');
    
    worksheet['!cols'] = [
      { wch: 30 }, { wch: 50 }, { wch: 20 }, { wch: 15 }, { wch: 50 }, { wch: 40 },
    ];

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    if (Platform.OS === 'web') {
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'mau_import_san_pham.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('Chưa hỗ trợ', 'Tải file mẫu chưa được hỗ trợ trên di động. Vui lòng sử dụng phiên bản web.');
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      });
      if (!result.canceled) {
        setFile(result.assets[0]);
        setImportResult(null);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Lỗi', 'Không thể chọn file.');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setImportResult(null);

    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) throw new Error("File không có dữ liệu.");

          const { data: result, error } = await supabase.functions.invoke('import-products', {
            body: { products: jsonData },
          });

          if (error) throw error;

          setImportResult(`Thành công! Đã import ${result.successCount} sản phẩm. Thất bại: ${result.errorCount}. ${result.errors.length > 0 ? 'Chi tiết lỗi: ' + result.errors.join('; ') : ''}`);
          if (result.successCount > 0) onSuccess();
        } catch (err: any) {
          setImportResult(`Lỗi: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsBinaryString(blob);
    } catch (err: any) {
      setImportResult(`Lỗi: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={handleClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Import sản phẩm</Text>
            <TouchableOpacity onPress={handleClose}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
          </View>
          
          <Text style={styles.instructions}>1. Tải file mẫu Excel về máy.</Text>
          <TouchableOpacity style={styles.templateButton} onPress={handleDownloadTemplate}>
            <Ionicons name="download-outline" size={20} color="#73509c" />
            <Text style={styles.templateButtonText}>Tải file mẫu</Text>
          </TouchableOpacity>

          <Text style={styles.instructions}>2. Điền thông tin sản phẩm vào file mẫu và lưu lại.</Text>
          <Text style={styles.note}>Lưu ý: Tên phân loại (category) phải khớp với tên đã có trong hệ thống.</Text>

          <Text style={styles.instructions}>3. Tải file đã điền thông tin lên hệ thống.</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickFile}>
            <Ionicons name="cloud-upload-outline" size={20} color="#3b82f6" />
            <Text style={styles.uploadButtonText} numberOfLines={1}>{file ? file.name : 'Chọn file Excel'}</Text>
          </TouchableOpacity>

          {importResult && <Text style={styles.resultText}>{importResult}</Text>}

          <TouchableOpacity style={styles.importButton} onPress={handleImport} disabled={loading || !file}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.importButtonText}>Bắt đầu Import</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: { width: '90%', maxWidth: 500, backgroundColor: 'white', borderRadius: 16, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  instructions: { fontSize: 16, color: '#333', marginTop: 16, marginBottom: 8 },
  note: { fontSize: 14, color: '#ef4444', fontStyle: 'italic', marginBottom: 8, marginLeft: 16 },
  templateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  templateButtonText: { color: '#73509c', fontWeight: 'bold', marginLeft: 8 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
  uploadButtonText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 8, flex: 1 },
  importButton: { backgroundColor: '#73509c', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  importButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultText: { marginTop: 16, color: '#16a34a', textAlign: 'center', fontSize: 14 },
});

export default ImportProductsModal;