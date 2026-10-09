import React from 'react';
import {
  IconDefinition,
} from '@fortawesome/fontawesome-svg-core';
import {
  FontAwesomeIcon,
} from '@fortawesome/react-native-fontawesome';
import {
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import {colors} from '../../theme/colors';

interface AppIconProps {
  icon: IconDefinition;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function AppIcon({
  icon,
  size = 20,
  color = colors.textPrimary,
  style,
  accessibilityLabel,
}: AppIconProps) {
  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={
        accessibilityLabel ? 'auto' : 'no-hide-descendants'
      }
      style={[{width: size, height: size}, style]}>
      <FontAwesomeIcon icon={icon} size={size} color={color} />
    </View>
  );
}