import React, {useEffect, useRef} from 'react';
import {
  Animated,
  StyleSheet,
  View,
} from 'react-native';

import {colors} from '../../theme/colors';
import {useResponsive} from '../../hooks/useResponsive';

export function CarCardSkeleton() {
  const {r} = useResponsive();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 0.9, duration: 700, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 0.45, duration: 700, useNativeDriver: true}),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={[styles.card, {borderRadius: r(12), marginBottom: r(16)}]}>
      <Animated.View style={[styles.image, {height: r(198), opacity}]} />
      <View style={{padding: r(16), gap: r(12)}}>
        <Animated.View style={[styles.line, styles.line45, {height: r(18), opacity}]} />
        <Animated.View style={[styles.line, styles.line72, {height: r(12), opacity}]} />
        <Animated.View style={[styles.line, styles.line50, {height: r(16), opacity}]} />
        <View style={[styles.actions, {height: r(48), gap: r(8)}]}>
          <Animated.View style={[styles.line, styles.actionPrimary, {opacity}]} />
          <Animated.View style={[styles.line, styles.actionSecondary, {opacity}]} />
          <Animated.View style={[styles.line, styles.actionSecondary, {opacity}]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    elevation: 2,
  },
  image: {
    backgroundColor: colors.skeleton,
  },
  line: {
    backgroundColor: colors.skeleton,
    borderRadius: 6,
  },
  line45: {width: '45%'},
  line72: {width: '72%'},
  line50: {width: '50%'},
  actions: {
    flexDirection: 'row',
  },
  actionPrimary: {flex: 2},
  actionSecondary: {flex: 1},
});