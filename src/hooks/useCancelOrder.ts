import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/integrations/supabase/client';
import { useCart } from '@/providers/CartProvider';
import Toast from 'react-native-toast-message';

export const useCancelOrder = (orderId: string) => {
  const queryClient = useQueryClient();
  const { anonymousDeviceId } = useCart();

  const { mutate: cancelOrder, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      // Dữ liệu gửi đến Edge Function
      const payload = {
        order_id: orderId,
        anonymous_device_id: anonymousDeviceId,
      };

      const { data, error } = await supabase.functions.invoke('cancel-order', {
        body: payload,
      });

      if (error) {
        // Cố gắng phân tích lỗi từ phản hồi của function để thông báo rõ ràng hơn
        let errorMessage = error.message;
        try {
          const parsedError = JSON.parse(error.context?.response?.text || '{}');
          if (parsedError.error) {
            errorMessage = parsedError.error;
          }
        } catch (e) {
          // Bỏ qua lỗi phân tích, sử dụng thông báo gốc
        }
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: async () => {
      // Vô hiệu hóa query của đơn hàng này để fetch lại dữ liệu mới (trạng thái "Đã hủy")
      await queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      
      // Vô hiệu hóa danh sách đơn hàng để cập nhật
      await queryClient.invalidateQueries({ queryKey: ['orders'] });

      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đơn hàng của bạn đã được hủy.',
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.',
      });
    },
  });

  return { cancelOrder, isCancelling };
};