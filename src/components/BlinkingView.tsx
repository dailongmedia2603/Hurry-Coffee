import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

interface BlinkingViewProps extends ViewProps {
  duration?: number;
}

const BlinkingView: React.FC<BlinkingViewProps> = ({ children, style, duration = 600 }) => {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity, duration]);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
};

export default BlinkingView;