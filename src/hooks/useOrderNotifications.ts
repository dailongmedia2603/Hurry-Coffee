import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { Order } from '@/types';

const useOrderNotifications = () => {
  const router = useRouter();

  useEffect(() => {
    // Tính năng này chỉ dành cho web
    if (Platform.OS !== 'web') {
      return;
    }

    const requestNotificationPermission = async () => {
      if (!('Notification' in window)) {
        console.log("Trình duyệt này không hỗ trợ thông báo trên desktop.");
        return;
      }

      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };

    requestNotificationPermission();

    const handleNewOrder = (payload: { new: Order }) => {
      if (Notification.permission === 'granted') {
        // Phát âm thanh
        const audio = new Audio('/assets/sounds/codon.mp3');
        audio.play().catch(error => console.log("Lỗi phát âm thanh:", error));

        // Hiển thị thông báo
        const newOrder = payload.new;
        const notification = new Notification('Có đơn hàng mới!', {
          body: `Đơn hàng #${newOrder.id.substring(0, 8)} từ ${newOrder.customer_name || 'Khách vãng lai'}.`,
          icon: '/assets/images/logo-app-PWA.png', // Đảm bảo file này tồn tại trong public
        });

        // Chuyển hướng khi nhấp vào thông báo
        notification.onclick = () => {
          router.push(`/staff/order/${newOrder.id}`);
        };
      }
    };

    const channel = supabase
      .channel('public:orders')
      .on<Order>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        handleNewOrder
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Đã kết nối kênh thông báo đơn hàng cho nhân viên.');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Lỗi kênh thông báo:', err);
        }
      });

    // Dọn dẹp khi component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
};

export default useOrderNotifications;