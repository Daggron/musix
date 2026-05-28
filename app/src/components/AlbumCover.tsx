import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {hueToGradient, FONTS} from '../theme';

interface Props {
  albumName?: string;
  hue?: number;
  size?: number;
  radius?: number;
}

export function AlbumCover({
  albumName = '??',
  hue = 30,
  size = 56,
  radius = 6,
}: Props) {
  const initials = albumName
    .split(' ')
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  const [start, end] = hueToGradient(hue);

  return (
    <LinearGradient
      colors={[start, end]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[styles.container, {width: size, height: size, borderRadius: radius}]}>
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.32,
            letterSpacing: -0.02 * size,
          },
        ]}>
        {initials}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    color: 'rgba(255, 240, 220, 0.9)',
  },
});
