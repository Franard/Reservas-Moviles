import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export function ThemedView({ style, ...rest }: ViewProps) {
  const { paleta } = useTheme();
  return <View style={[{ backgroundColor: paleta.fondo }, style]} {...rest} />;
}

