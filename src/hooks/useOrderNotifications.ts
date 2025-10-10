import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { Order } from '@/types';

const useOrderNotifications = () => {
  const router = useRouter();

  useEffect(() => {
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

    // Tạo một kênh Supabase để lắng nghe kênh PostgreSQL tùy chỉnh
    const channel = supabase.channel('new_order_notifications');

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // Vẫn giữ listener này để cập nhật UI nếu cần, nhưng không dùng cho thông báo ban đầu
        console.log('Order change detected:', payload);
      })
      .on('broadcast', { event: 'new_order' }, (payload) => {
        // Đây là listener chính cho thông báo
        console.log('New order broadcast received!', payload);
        const newOrder = payload.payload.new as Order;

        if (Notification.permission === 'granted') {
          const audio = new Audio('/assets/sounds/codon.mp3');
          audio.play().catch(error => console.log("Lỗi phát âm thanh:", error));

          const notification = new Notification('Có đơn hàng mới!', {
            body: `Đơn hàng #${newOrder.id.substring(0, 8)} từ ${newOrder.customer_name || 'Khách vãng lai'}.`,
            icon: '/assets/images/logo-app-PWA.png',
          });

          notification.onclick = () => {
            // Chuyển hướng dựa trên vai trò của người dùng hiện tại
            // Giả sử hook này chỉ dùng cho staff/admin
            router.push(`/staff/order/${newOrder.id}`);
          };
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Đã kết nối kênh thông báo đơn hàng tùy chỉnh.');
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