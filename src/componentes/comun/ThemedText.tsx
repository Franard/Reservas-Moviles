import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export function ThemedText({ style, ...rest }: TextProps) {
  const { paleta } = useTheme();
  return <Text style={[{ color: paleta.texto }, style]} {...rest} />;
}

