import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../../shared/constants';

export const RegisterScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.heading3,
    color: colors.text,
  },
});
