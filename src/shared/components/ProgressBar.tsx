import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors, borderRadius } from '../constants';

interface ProgressBarProps {
  /** Progress percentage (0-100+). */
  percentage: number;
  /** Override height (default 6). */
  height?: number;
  style?: ViewStyle;
}

function getColor(percentage: number): string {
  if (percentage >= 100) return colors.error[500];
  if (percentage >= 80) return colors.warning[500];
  return colors.success[500];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  height = 6,
  style,
}) => {
  const clampedWidth = Math.min(percentage, 100);
  const barColor = getColor(percentage);

  return (
    <View style={[styles.track, { height }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedWidth}%`,
            backgroundColor: barColor,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.white[20],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
