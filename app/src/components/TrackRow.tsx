import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AlbumCover} from './AlbumCover';
import {FlacChip} from './FlacChip';
import {IconPlay} from './Icons';
import {useTheme, FONTS} from '../theme';
import {fmtTime} from '../data/mockData';
import type {Song} from '../data/mockData';

interface Props {
  song: Song;
  isCurrent?: boolean;
  isPlaying?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export function TrackRow({
  song,
  isCurrent = false,
  isPlaying = false,
  onPress,
  compact = false,
}: Props) {
  const theme = useTheme();
  const coverSize = compact ? 38 : 44;

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.row,
        {
          borderBottomColor: theme.rule,
          paddingVertical: compact ? 8 : 10,
          backgroundColor: pressed ? (theme.dark ? 'rgba(241,230,207,0.04)' : 'rgba(42,30,20,0.05)') : 'transparent',
        },
      ]}>
      <View style={styles.coverWrap}>
        <AlbumCover
          albumName={song.al}
          hue={song.hue}
          size={coverSize}
          radius={5}
        />
        {isCurrent && (
          <View style={styles.playingOverlay}>
            <IconPlay size={16} color="white" />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {color: isCurrent ? theme.accent : theme.ink},
          ]}>
          {song.t}
        </Text>
        <Text numberOfLines={1} style={[styles.subtitle, {color: theme.ink3}]}>
          {song.ar}{' '}
          <Text style={{color: theme.ink4}}>·</Text> {song.al}
        </Text>
      </View>
      <View style={styles.meta}>
        <FlacChip />
        <Text style={[styles.duration, {color: theme.ink3}]}>
          {fmtTime(song.d)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  coverWrap: {
    position: 'relative',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 3,
  },
  duration: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
