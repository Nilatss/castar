import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../../shared/constants';

export const BudgetDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budget Detail</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    ...typography.heading3,
    color: colors.text,
  },
});
