import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {AlbumCover} from './AlbumCover';
import {IconPlay, IconPause, IconNext} from './Icons';
import {useTheme, FONTS} from '../theme';
import type {Song} from '../data/mockData';

interface Props {
  song: Song;
  playing: boolean;
  onToggle: () => void;
  onNext: () => void;
  onOpen: () => void;
}

export function MiniPlayer({song, playing, onToggle, onNext, onOpen}: Props) {
  const theme = useTheme();

  return (
    <Pressable onPress={onOpen} style={[styles.container, {backgroundColor: theme.card, borderColor: theme.ruleStrong}]}>
      <AlbumCover albumName={song.al} hue={song.hue} size={44} radius={8} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.title, {color: theme.ink}]}>
          {song.t}
        </Text>
        <Text numberOfLines={1} style={[styles.artist, {color: theme.ink3}]}>
          {song.ar}
        </Text>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        hitSlop={8}
        style={styles.btn}>
        {playing ? (
          <IconPause size={20} color={theme.ink} />
        ) : (
          <IconPlay size={20} color={theme.ink} />
        )}
      </Pressable>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onNext();
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
