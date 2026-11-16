import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../components/theme';

export default function TvLayout() {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.palette.bg } }} />;
}
