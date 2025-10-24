import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

// Chúng ta định nghĩa một ngưỡng (breakpoint) để xác định màn hình desktop.
// Bất kỳ màn hình nào có chiều rộng từ 768px trở lên sẽ được coi là desktop.
const DESKTOP_BREAKPOINT = 768;

interface ScreenSize {
  width: number;
  height: number;
  isDesktop: boolean;
}

/**
 * Một custom hook để theo dõi kích thước màn hình và xác định xem có phải là giao diện desktop hay không.
 * @returns {ScreenSize} Một đối tượng chứa width, height, và một boolean isDesktop.
 */
export const useScreenSize = (): ScreenSize => {
  // Lấy kích thước cửa sổ ban đầu và lưu vào state.
  const [screenSize, setScreenSize] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    // Hàm này sẽ được gọi mỗi khi kích thước cửa sổ thay đổi.
    const handleResize = ({ window }: { window: ScaledSize }) => {
      setScreenSize(window);
    };

    // Đăng ký một "listener" để theo dõi sự kiện 'change' của Dimensions.
    const subscription = Dimensions.addEventListener('change', handleResize);

    // Đây là bước dọn dẹp quan trọng: gỡ bỏ listener khi component không còn được sử dụng
    // để tránh rò rỉ bộ nhớ (memory leaks).
    return () => {
      subscription.remove();
    };
  }, []); // Mảng rỗng đảm bảo effect này chỉ chạy một lần khi component được mount.

  return {
    width: screenSize.width,
    height: screenSize.height,
    isDesktop: screenSize.width >= DESKTOP_BREAKPOINT,
  };
};