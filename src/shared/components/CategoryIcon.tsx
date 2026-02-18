import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { borderRadius, iconSize, typography } from '../constants';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const sizeMap = {
  sm: iconSize.lg,
  md: iconSize['2xl'],
  lg: iconSize['3xl'],
} as const;

const fontSizeMap = {
  sm: 14,
  md: 20,
  lg: 26,
} as const;

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  color,
  size = 'md',
  style,
}) => {
  const dimension = sizeMap[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: borderRadius.full,
          backgroundColor: color + '20', // 12% opacity
        },
        style,
      ]}
    >
      <Text style={{ fontSize: fontSizeMap[size] }}>{icon}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
