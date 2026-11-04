import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform } from 'react-native';

/** Ressorts partagés : rapides, sans rebond excessif. */
export const SPRING = {
  press: { speed: 40, bounciness: 0 },
  release: { speed: 22, bounciness: 8 },
  enter: { damping: 18, stiffness: 180, mass: 1 },
} as const;

export const nativeDriver = Platform.OS !== 'web';

/** Préférence système « Réduire les animations ». */
export function useSystemReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    const read = AccessibilityInfo.isReduceMotionEnabled;
    if (typeof read === 'function')
      read()
        .then((v) => {
          if (alive) setReduce(v);
        })
        .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => setReduce(v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

/** Échelle au toucher (ressort). Renvoie l’Animated.Value et les gestionnaires. */
export function usePressScale(reduce: boolean, to = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    if (reduce) return;
    Animated.spring(scale, { toValue: to, useNativeDriver: nativeDriver, ...SPRING.press }).start();
  };
  const onPressOut = () => {
    if (reduce) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, ...SPRING.release }).start();
  };
  return { scale, onPressIn, onPressOut };
}

/** Apparition douce (fondu + léger glissement), une fois au montage. */
export function useEntrance(reduce: boolean, delay = 0, distance = 10) {
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    const anim = Animated.spring(v, { toValue: 1, delay, useNativeDriver: nativeDriver, ...SPRING.enter });
    anim.start();
    return () => anim.stop();
  }, [v, reduce, delay]);
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  };
}
