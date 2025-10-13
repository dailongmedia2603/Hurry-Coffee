import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/integrations/supabase/client';
import { Order } from '@/types';
import { useAuth } from '@/src/context/AuthContext';

const useOrderNotifications = () => {
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web' || !profile) {
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

    const channel = supabase.channel('new_order_notifications');

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Order change detected:', payload);
      })
      .on('broadcast', { event: 'new_order' }, (payload) => {
        console.log('New order broadcast received!', payload);
        const newOrder = payload.payload.new as Order;

        const isAdmin = profile.role === 'admin';
        const isStaffForThisOrder = profile.role === 'staff' && newOrder.pickup_location_id === profile.location_id;

        if (isAdmin || isStaffForThisOrder) {
          console.log(`Notification condition met for user ${profile.role}. Triggering notification.`);
          
          if (Notification.permission === 'granted') {
            const audio = new Audio('/assets/sounds/codon.mp3');
            audio.play().catch(error => console.log("Lỗi phát âm thanh:", error));

            const notification = new Notification('Có đơn hàng mới!', {
              body: `Đơn hàng #${newOrder.id.substring(0, 8)} từ ${newOrder.customer_name || 'Khách vãng lai'}.`,
              icon: '/assets/images/logo-app-PWA.png',
            });

            notification.onclick = () => {
              router.push(isAdmin ? `/admin/order/${newOrder.id}` : `/staff/order/${newOrder.id}`);
            };
          }
        } else {
          console.log(`Notification condition NOT met for user ${profile.role}. Skipping.`);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, profile]);
};

export default useOrderNotifications;