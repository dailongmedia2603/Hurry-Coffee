import { supabase } from '@/src/integrations/supabase/client';
import { Alert } from 'react-native';

/**
 * Handles the order cancellation process.
 * It shows a confirmation dialog, then updates the order status in Supabase.
 * @param orderId The ID of the order to cancel.
 * @param onSuccess A callback function to run after successful cancellation.
 */
export const cancelOrder = (orderId: string, onSuccess: () => void) => {
  Alert.alert(
    "Xác nhận huỷ đơn",
    "Bạn có chắc chắn muốn huỷ đơn hàng này không?",
    [
      { 
        text: "Không", 
        style: "cancel" 
      },
      {
        text: "Đồng ý",
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('orders')
              .update({ status: 'Đã huỷ' })
              .eq('id', orderId);

            if (error) {
              throw error;
            }

            Alert.alert("Thành công", "Đã huỷ đơn hàng thành công.");
            onSuccess();
          } catch (error: any) {
            console.error("Error cancelling order:", error);
            Alert.alert("Lỗi", "Không thể huỷ đơn hàng. Vui lòng thử lại.");
          }
        },
      },
    ],
    { cancelable: true }
  );
};