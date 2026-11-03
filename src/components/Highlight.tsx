import React from 'react';
import { Text, TextStyle, StyleProp, TextProps } from 'react-native';
import { highlightColors } from '../theme';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function Highlight({
  text,
  query,
  style,
  color,
  ...rest
}: TextProps & { text: string; query?: string; style?: StyleProp<TextStyle>; color?: string }) {
  const q = (query ?? '').trim();
  const mark = highlightColors.yellow;
  if (!text || q.length < 2 || q.toLowerCase() === 'undefined' || q.toLowerCase() === 'null') {
    return (
      <Text {...rest} style={style}>
        {text}
      </Text>
    );
  }
  const parts = text.split(new RegExp(`(${escape(q)})`, 'gi'));
  return (
    <Text {...rest} style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <Text key={i} style={{ backgroundColor: color ?? mark.bg, color: mark.text, fontWeight: '700' }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}
