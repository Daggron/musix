import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme, FONTS} from '../theme';

interface Props {
  title: string;
  kicker?: string;
  right?: React.ReactNode;
}

export function PageHeader({title, kicker, right}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {kicker && (
        <Text style={[styles.kicker, {color: theme.ink3}]}>{kicker}</Text>
      )}
      <View style={styles.row}>
        <Text style={[styles.title, {color: theme.ink}]}>{title}</Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  kicker: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: 2.1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -0.5,
    flex: 1,
  },
});
