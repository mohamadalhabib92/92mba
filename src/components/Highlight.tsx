import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { colors } from '../theme';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function Highlight({ text, query, style, color }: { text: string; query?: string; style?: StyleProp<TextStyle>; color?: string }) {
  const q = (query ?? '').trim();
  if (q.length < 2) return <Text style={style}>{text}</Text>;
  const parts = text.split(new RegExp(`(${escape(q)})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase() ? (
          <Text key={i} style={{ backgroundColor: color ?? colors.highlight, color: '#1A1A1A', fontWeight: '700' }}>
            {p}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}
