import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AlbumCover} from './AlbumCover';
import {IconPlay, IconPause, IconNext} from './Icons';
import {useTheme, FONTS} from '../theme';
import {usePlayerStore} from '../store';

export function MiniPlayer({onOpen}: {onOpen: () => void}) {
  const theme = useTheme();
  const track = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const next = usePlayerStore((s) => s.next);

  if (!track) return null;

  return (
    <Pressable
      onPress={onOpen}
      style={[
        styles.container,
        {backgroundColor: theme.card, borderColor: theme.ruleStrong},
      ]}>
      <AlbumCover albumName={track.album} hue={track.hue} size={44} radius={8} artworkPath={track.artworkPath} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.title, {color: theme.ink}]}>
          {track.title}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, {color: theme.ink3}]}>
          {track.artist}
        </Text>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          isPlaying ? pause() : resume();
        }}
        hitSlop={8}
        style={styles.btn}>
        {isPlaying ? (
          <IconPause size={20} color={theme.ink} />
        ) : (
          <IconPlay size={20} color={theme.ink} />
        )}
      </Pressable>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          next();
        }}
        hitSlop={8}
        style={styles.btn}>
        <IconNext size={20} color={theme.ink2} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 88,
    zIndex: 25,
    borderRadius: 14,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    shadowColor: 'rgba(42,20,8,1)',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  info: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 4,
  },
  title: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 17,
  },
  artist: {
    fontSize: 11,
  },
  btn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
