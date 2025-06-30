import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {DesignSystem} from '../theme/designSystem';

export const NotesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Notlar Ekranı</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.Colors.neutral[50],
  },
  text: {
    ...DesignSystem.Typography.h2,
    color: DesignSystem.Colors.neutral[600],
  },
});
