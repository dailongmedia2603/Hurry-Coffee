import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/integrations/supabase/client';
import { useAnonymousId } from './useAnonymousId';
import Toast from 'react-native-toast-message';

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  const { anonymousId } = useAnonymousId();

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const { error, data } = await supabase.functions.invoke('cancel-order', {
        body: {
          order_id: orderId,
          anonymous_device_id: anonymousId,
        },
      });

      if (error) {
        let errorMessage = error.message;
        try {
          // Edge functions return errors in the response body
          const functionError = data?.error || 'Lỗi không xác định';
          errorMessage = functionError;
        } catch (e) {
          // Ignore parsing error, use original message
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: (_, variables) => {
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đơn hàng của bạn đã được hủy.',
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.',
      });
    },
  });
};