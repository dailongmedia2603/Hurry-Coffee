import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/providers/CartProvider';
import Toast from 'react-native-toast-message';

export const useCancelOrder = () => {
  const { anonymousDeviceId } = useCart();
  const queryClient = useQueryClient();

  const { mutate: cancelOrder, isPending: isCancelling } = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke('cancel-order', {
        body: {
          order_id: orderId,
          anonymous_device_id: anonymousDeviceId, // Gửi kèm ID của thiết bị
        },
      });

      if (error) {
        console.error('Lỗi từ function cancel-order:', error);
        let errorMessage = 'Không thể hủy đơn hàng. Vui lòng thử lại.';
        try {
            // Cố gắng phân tích lỗi từ phản hồi của function
            const parsedError = JSON.parse(error.message);
            if (parsedError.error) {
                errorMessage = parsedError.error;
            }
        } catch (e) {
            if (typeof error.message === 'string') {
                errorMessage = error.message;
            }
        }
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: async (_: unknown, orderId: string) => {
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đơn hàng của bạn đã được hủy.',
      });
      // Vô hiệu hóa và làm mới dữ liệu đơn hàng để cập nhật giao diện
      await queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message,
      });
    },
  });

  return { cancelOrder, isCancelling };
};