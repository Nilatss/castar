import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onChange,
}) => (
  <View style={styles.container}>
    {options.map((option, index) => {
      const isSelected = index === selectedIndex;
      return (
        <TouchableOpacity
          key={option}
          onPress={() => onChange(index)}
          activeOpacity={0.7}
          style={[styles.segment, isSelected && styles.segmentActive]}
        >
          <Text style={[styles.text, isSelected && styles.textActive]}>
            {option}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  segmentActive: {
    backgroundColor: colors.surfaceElevated,
  },
  text: {
    ...typography.smallMedium,
    color: colors.textTertiary,
  },
  textActive: {
    color: colors.white[100],
  },
});
