import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, TouchableOpacity, Platform, ScrollView, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/integrations/supabase/client';
import { Order, OrderStatus, Location } from '@/types';
import { formatDisplayPhone } from '@/src/utils/formatters';
import AttentionView from '@/src/components/AttentionView';
import TransferOrderModal from '@/src/components/TransferOrderModal';
import { useAuth } from '@/src/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
const formatDate = (date: string) => new Date(date).toLocaleString('vi-VN');

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'Đang giao': return { color: '#2979FF', backgroundColor: '#E3F2FD', text: 'Đang giao' };
    case 'Sẵn sàng': return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Sẵn sàng' };
    case 'Hoàn thành': return { color: '#00C853', backgroundColor: '#E8F5E9', text: 'Hoàn thành' };
    case 'Đang xử lý': return { color: '#FF9100', backgroundColor: '#FFF3E0', text: 'Đang xử lý' };
    case 'Đang làm': return { color: '#3b82f6', backgroundColor: '#dbeafe', text: 'Đang làm' };
    case 'Đã hủy': return { color: '#D50000', backgroundColor: '#FFEBEE', text: 'Đã hủy' };
    case 'Không gọi được': return { color: '#D50000', backgroundColor: '#FFEBEE', text: 'Không gọi được' };
    default: return { color: '#666', backgroundColor: '#F5F5F5', text: 'Không rõ' };
  }
};

const STATUS_OPTIONS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đang xử lý', value: 'Đang xử lý' },
    { label: 'Đang làm', value: 'Đang làm' },
    { label: 'Đang giao', value: 'Đang giao' },
    { label: 'Sẵn sàng', value: 'Sẵn sàng' },
    { label: 'Hoàn thành', value: 'Hoàn thành' },
    { label: 'Đã hủy', value: 'Đã hủy' },
];

type OrderWithItemCount = Order & { items_count: number; location_name: string | null };

export default function StaffOrdersScreen() {
  const [orders, setOrders] = useState<OrderWithItemCount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isTransferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const [assignedLocations, setAssignedLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | 'all'>('all');
  const [isLocationFilterOpen, setLocationFilterOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchOrders = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    const { data, error } = await supabase.rpc('get_staff_orders');
    if (error) {
        console.error("Error fetching staff orders:", error);
        Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng.');
        setOrders([]);
    } else {
        setOrders((data as OrderWithItemCount[]) || []);
    }
    if (isInitialLoad) setLoading(false);
  }, []);

  const fetchAssignedLocations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('staff_locations').select('locations(*)').eq('staff_id', user.id);
    if (error) console.error("Error fetching assigned locations:", error);
    else if (data) setAssignedLocations(data.map(item => item.locations).filter(Boolean) as unknown as Location[]);
  }, [user]);

  useFocusEffect(useCallback(() => {
    fetchOrders(true);
    fetchAssignedLocations();
    setLocationFilterOpen(false);
  }, [fetchOrders, fetchAssignedLocations]));

  const newOrderCounts = useMemo(() => {
    const counts: { [key: string]: number } = { all: 0 };
    orders.forEach(order => {
        if (order.status === 'Đang xử lý') {
            counts.all++;
            if (order.pickup_location_id) counts[order.pickup_location_id] = (counts[order.pickup_location_id] || 0) + 1;
        }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (selectedLocationId !== 'all') filtered = filtered.filter(order => order.pickup_location_id === selectedLocationId);
    if (selectedStatus !== 'all') filtered = filtered.filter(order => order.status === selectedStatus);
    if (selectedDate) {
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= startDate && orderDate <= endDate;
        });
    }
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(order => order.id.substring(0, 8).toLowerCase().includes(lowercasedQuery));
    }
    return filtered;
  }, [orders, selectedLocationId, selectedStatus, selectedDate, searchQuery]);

  const onDateChange = (event: any, selectedDateValue?: Date) => {
    setDatePickerVisible(Platform.OS === 'ios');
    if (selectedDateValue) setSelectedDate(selectedDateValue);
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setSelectedDate(null);
  };

  const handleOpenTransferModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setTransferModalVisible(true);
  };

  const handleTransferSuccess = () => {
    setTransferModalVisible(false);
    setSelectedOrderId(null);
    fetchOrders(true);
  };

  const renderOrderItem = ({ item }: { item: OrderWithItemCount }) => {
    const statusStyle = getStatusStyle(item.status);
    const needsVerification = !item.is_phone_verified;
    const orderTitle = item.order_type === 'pickup' ? `Đơn ghé lấy #${item.id.substring(0, 8)}` : `Đơn giao hàng #${item.id.substring(0, 8)}`;
    const isNew = item.status === 'Đang xử lý';

    return (
      <View style={styles.itemCard}>
        <TouchableOpacity onPress={() => router.push(`/staff/order/${item.id}`)}>
          {needsVerification && (
            <View style={styles.verificationBadge}><Ionicons name="call" size={14} color="#fff" /><Text style={styles.verificationText}>Cần gọi xác nhận</Text></View>
          )}
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{orderTitle}</Text>
            <View style={styles.headerRight}>
              {isNew && (
                <AttentionView style={styles.newOrderBadge}><Ionicons name="sparkles" size={14} color="#b91c1c" /><Text style={styles.newOrderText}>Đơn mới</Text></AttentionView>
              )}
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}><Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text></View>
            </View>
          </View>
          <View style={styles.itemInfoRow}><Ionicons name="person-outline" size={16} color="#6b7280" /><Text style={styles.itemInfoText}>{item.customer_name || 'Khách vãng lai'}</Text></View>
          <View style={styles.itemInfoRow}><Ionicons name="call-outline" size={16} color="#6b7280" /><Text style={styles.itemInfoText}>{formatDisplayPhone(item.customer_phone) || 'Không có SĐT'}</Text></View>
          {item.location_name && (
            <View style={styles.itemInfoRow}><Ionicons name="storefront-outline" size={16} color="#6b7280" /><Text style={styles.itemInfoText}>{item.location_name}</Text></View>
          )}
          <View style={styles.itemFooter}><Text style={styles.itemDate}>{formatDate(item.created_at)}</Text><Text style={styles.itemPrice}>{formatPrice(item.total)}</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.transferButton} onPress={() => handleOpenTransferModal(item.id)}><Ionicons name="swap-horizontal-outline" size={16} color="#3b82f6" /><Text style={styles.transferButtonText}>Chuyển đơn</Text></TouchableOpacity>
      </View>
    );
  };

  const renderLocationFilter = () => {
    if (assignedLocations.length <= 1) return null;
    const selectedLocationName = selectedLocationId === 'all' ? 'Tất cả địa điểm' : assignedLocations.find(loc => loc.id === selectedLocationId)?.name || 'Tất cả địa điểm';
    const countForSelected = newOrderCounts[selectedLocationId] || 0;

    return (
      <View style={styles.locationFilterContainer}>
        <TouchableOpacity style={styles.filterButton} onPress={() => setLocationFilterOpen(!isLocationFilterOpen)}>
          <Ionicons name="storefront-outline" size={20} color="#6b7280" />
          <Text style={styles.filterButtonText}>{selectedLocationName}</Text>
          {!isLocationFilterOpen && countForSelected > 0 && (<View style={[styles.badge, { marginRight: 8 }]}><Text style={styles.badgeText}>{countForSelected}</Text></View>)}
          <Ionicons name={isLocationFilterOpen ? "chevron-up-outline" : "chevron-down-outline"} size={20} color="#6b7280" />
        </TouchableOpacity>
        {isLocationFilterOpen && (
          <View style={styles.filterDropdown}>
            <TouchableOpacity style={styles.filterOption} onPress={() => { setSelectedLocationId('all'); setLocationFilterOpen(false); }}>
              <Text style={styles.filterOptionText}>Tất cả địa điểm</Text>
              {newOrderCounts['all'] > 0 && (<View style={styles.badge}><Text style={styles.badgeText}>{newOrderCounts['all']}</Text></View>)}
            </TouchableOpacity>
            {assignedLocations.map(location => {
              const count = newOrderCounts[location.id] || 0;
              return (
                <TouchableOpacity key={location.id} style={styles.filterOption} onPress={() => { setSelectedLocationId(location.id); setLocationFilterOpen(false); }}>
                  <Text style={styles.filterOptionText}>{location.name}</Text>
                  {count > 0 && (<View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>)}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderLocationFilter()}
      <View style={styles.searchAndFilterContainer}>
        <View style={styles.searchBar}><Ionicons name="search" size={20} color="#989898" style={{marginRight: 12}} /><TextInput placeholder="Tìm theo mã đơn hàng..." style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} /></View>
        <TouchableOpacity style={styles.filterToggleButton} onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}><Ionicons name="options-outline" size={24} color="#333" /></TouchableOpacity>
      </View>
      {showAdvancedFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterSectionTitle}>Trạng thái</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilterContainer}>
            {STATUS_OPTIONS.map(option => (<TouchableOpacity key={option.value} style={[styles.statusButton, selectedStatus === option.value && styles.statusButtonActive]} onPress={() => setSelectedStatus(option.value)}><Text style={[styles.statusButtonText, selectedStatus === option.value && styles.statusButtonTextActive]}>{option.label}</Text></TouchableOpacity>))}
          </ScrollView>
          <Text style={styles.filterSectionTitle}>Thời gian</Text>
          <View style={styles.dateFilterContainer}>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setDatePickerVisible(true)}><Ionicons name="calendar-outline" size={20} color="#666" /><Text style={styles.datePickerButtonText}>{selectedDate ? selectedDate.toLocaleDateString('vi-VN') : 'Chọn ngày'}</Text></TouchableOpacity>
            {selectedDate && (<TouchableOpacity onPress={() => setSelectedDate(null)}><Ionicons name="close-circle" size={24} color="#999" /></TouchableOpacity>)}
          </View>
          <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}><Text style={styles.clearFilterButtonText}>Xoá bộ lọc</Text></TouchableOpacity>
        </View>
      )}
      {isDatePickerVisible && (<DateTimePicker value={selectedDate || new Date()} mode="date" display="default" onChange={onDateChange} />)}
      {loading ? (<ActivityIndicator size="large" color="#73509c" style={styles.loader} />) : filteredOrders.length === 0 ? (<View style={styles.emptyContainer}><Text style={styles.emptyText}>Không có đơn hàng nào.</Text></View>) : (<FlatList data={filteredOrders} keyExtractor={(item) => item.id} renderItem={renderOrderItem} contentContainerStyle={styles.listContainer} onRefresh={() => fetchOrders(true)} refreshing={loading} />)}
      <TransferOrderModal visible={isTransferModalVisible} onClose={() => setTransferModalVisible(false)} orderId={selectedOrderId} onSuccess={handleTransferSuccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingTop: 0 },
  itemCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 8 },
  headerRight: { alignItems: 'flex-end' },
  newOrderBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#fca5a5', marginBottom: 6 },
  newOrderText: { color: '#b91c1c', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-end' },
  statusText: { fontSize: 12, fontWeight: '500' },
  itemInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemInfoText: { fontSize: 14, color: '#374151', marginLeft: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12, marginTop: 8 },
  itemDate: { fontSize: 12, color: '#6b7280' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
  verificationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  verificationText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  transferButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', paddingVertical: 10, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#dbeafe' },
  transferButtonText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 6 },
  locationFilterContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: '#f3f4f6', zIndex: 10 },
  filterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  filterButtonText: { flex: 1, marginLeft: 8, fontSize: 16, fontWeight: '500' },
  filterDropdown: { backgroundColor: '#fff', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#e5e7eb', position: 'absolute', top: 65, left: 16, right: 16 },
  filterOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterOptionText: { fontSize: 16, marginRight: 8 },
  badge: { backgroundColor: '#73509c', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  searchAndFilterContainer: { flexDirection: 'row', padding: 16, paddingTop: 0, alignItems: 'center', backgroundColor: '#f3f4f6' },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderColor: "#e5e7eb", borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, height: 50, marginRight: 12 },
  searchInput: { color: "#333", fontSize: 14, flex: 1 },
  filterToggleButton: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  filterPanel: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  statusFilterContainer: { paddingBottom: 12 },
  statusButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 10 },
  statusButtonActive: { backgroundColor: '#73509c' },
  statusButtonText: { color: '#374151', fontWeight: '500' },
  statusButtonTextActive: { color: '#fff' },
  dateFilterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  datePickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, marginRight: 10 },
  datePickerButtonText: { marginLeft: 8, fontSize: 16, color: '#333' },
  clearFilterButton: { marginTop: 16, alignItems: 'center' },
  clearFilterButtonText: { color: '#73509c', fontWeight: 'bold' },
});