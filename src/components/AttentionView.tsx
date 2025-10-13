import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

interface AttentionViewProps extends ViewProps {}

const AttentionView: React.FC<AttentionViewProps> = ({ children, style }) => {
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnimation, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(rotateAnimation, { toValue: -1, duration: 80, useNativeDriver: true }),
        Animated.timing(rotateAnimation, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(rotateAnimation, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.delay(800), // Tạm dừng một chút trước khi lặp lại
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [rotateAnimation]);

  const interpolatedRotation = rotateAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'], // Tăng góc xoay để hiệu ứng mạnh hơn
  });

  const animatedStyle = {
    transform: [{ rotate: interpolatedRotation }],
  };

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

export default AttentionView;