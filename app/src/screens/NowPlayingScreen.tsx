import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  AlbumCover,
  IconChevDown,
  IconCassette,
  IconDisc,
  IconShuffle,
  IconPrev,
  IconPlay,
  IconNext,
  IconRepeat,
  IconHeart,
  IconEQ,
  IconMore,
  FlacChip,
} from '../components';
import {useTheme, FONTS} from '../theme';
import {useThemeStore} from '../theme';
import {SONGS, fmtTime} from '../data/mockData';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
}

export function NowPlayingScreen({navigation}: Props) {
  const theme = useTheme();
  const playerKind = useThemeStore((s) => s.playerKind);
  const setPlayerKind = useThemeStore((s) => s.setPlayerKind);
  const song = SONGS[10]; // Waltz for Debby
  const progress = 0.34;
  const cur = song.d * progress;

  return (
    <View style={[styles.container, {backgroundColor: theme.paper}]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.btn}>
          <IconChevDown size={22} color={theme.ink} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={[styles.nowPlayingLabel, {color: theme.ink3}]}>
            NOW PLAYING
          </Text>
          <Text style={[styles.albumLabel, {color: theme.ink2}]}>
            from <Text style={{fontStyle: 'italic'}}>{song.al}</Text>
          </Text>
        </View>
        <Pressable
          onPress={() =>
            setPlayerKind(playerKind === 'vinyl' ? 'cassette' : 'vinyl')
          }
          style={styles.btn}>
          {playerKind === 'vinyl' ? (
            <IconCassette size={22} color={theme.ink} />
          ) : (
            <IconDisc size={22} color={theme.ink} />
          )}
        </Pressable>
      </View>

      <View style={styles.artwork}>
        <AlbumCover albumName={song.al} hue={song.hue} size={300} radius={12} />
      </View>

      <View style={styles.titleBlock}>
        <Text style={[styles.title, {color: theme.ink}]}>{song.t}</Text>
        <View style={styles.subtitleRow}>
          <Text style={[styles.artist, {color: theme.ink3}]}>{song.ar}</Text>
          <View style={[styles.dot, {backgroundColor: theme.ink4}]} />
          <Text style={[styles.artist, {color: theme.ink3}]}>{song.y}</Text>
          <FlacChip />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={[styles.progressTrack, {backgroundColor: theme.ruleStrong}]}>
          <View
            style={[
              styles.progressFill,
              {backgroundColor: theme.accent, width: `${progress * 100}%`},
            ]}
          />
          <View
            style={[
              styles.progressThumb,
              {
                backgroundColor: theme.accent,
                left: `${progress * 100}%`,
              },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.time, {color: theme.ink3}]}>
            {fmtTime(cur)}
          </Text>
          <Text style={[styles.time, {color: theme.ink3}]}>
            −{fmtTime(song.d - cur)}
          </Text>
        </View>
      </View>

      <View style={styles.transport}>
        <Pressable style={styles.sideBtn}>
          <IconShuffle size={22} color={theme.ink3} />
        </Pressable>
        <Pressable style={styles.transportBtn}>
          <IconPrev size={28} color={theme.ink} />
        </Pressable>
        <Pressable
          style={[styles.playBtn, {backgroundColor: theme.ink}]}>
          <IconPlay size={28} color={theme.paper} />
        </Pressable>
        <Pressable style={styles.transportBtn}>
          <IconNext size={28} color={theme.ink} />
        </Pressable>
        <Pressable style={styles.sideBtn}>
          <IconRepeat size={22} color={theme.ink3} />
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <Pressable style={styles.bottomBtn}>
          <IconHeart size={20} color={theme.ink3} />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Equalizer')}
          style={styles.eqBtn}>
          <IconEQ size={16} color={theme.ink3} />
          <Text style={[styles.eqText, {color: theme.ink3}]}>EQ · STUDIO</Text>
        </Pressable>
        <Pressable style={styles.bottomBtn}>
          <IconMore size={20} color={theme.ink3} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 62,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  btn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCenter: {
    alignItems: 'center',
  },
  nowPlayingLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.9,
  },
  albumLabel: {
    fontFamily: FONTS.serif,
    fontSize: 14,
  },
  artwork: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  titleBlock: {
    paddingHorizontal: 28,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 28,
    lineHeight: 30,
    textAlign: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  artist: {
    fontSize: 14,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  progressSection: {
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  progressTrack: {
    height: 3,
    borderRadius: 999,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  progressThumb: {
    position: 'absolute',
    top: -4.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  time: {
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  sideBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 18,
  },
  bottomBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eqText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
