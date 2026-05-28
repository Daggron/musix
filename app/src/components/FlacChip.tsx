import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {useTheme, FONTS} from '../theme';

export function FlacChip() {
  const theme = useTheme();
  return (
    <Text style={[styles.chip, {color: theme.flac, borderColor: theme.flac}]}>
      FLAC
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.7,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
});
