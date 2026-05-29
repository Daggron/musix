import React, {useRef, useState, useCallback} from 'react';
import {Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS} from 'react-native-reanimated';
import {
  AlbumCover,
  CassettePlayer,
  IconChevDown,
  IconCassette,
  IconDisc,
  IconShuffle,
  IconPrev,
  IconPlay,
  IconPause,
  IconNext,
  IconRepeat,
  IconHeart,
  IconHeartFilled,
  IconEQ,
  IconMore,
  FlacChip,
} from '../components';
import {VinylPlayer} from '../components/VinylPlayer';
import {useTheme, FONTS} from '../theme';
import {useThemeStore} from '../theme';
import {usePlayerStore, usePlaylistStore, useEQStore} from '../store';
import {fmtTime} from '../utils';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
}

export function NowPlayingScreen({navigation}: Props) {
  const theme = useTheme();
  const playerKind = useThemeStore((s) => s.playerKind);
  const setPlayerKind = useThemeStore((s) => s.setPlayerKind);

  const track = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const seekTo = usePlayerStore((s) => s.seekTo);

  const liked = usePlaylistStore((s) => s.isLiked);
  const toggleLike = usePlaylistStore((s) => s.toggleLike);
  const eqPreset = useEQStore((s) => s.preset);

  const trackWidthRef = useRef(0);
  const [seekProgress, setSeekProgress] = useState<number | null>(null);

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const clampSeek = useCallback((pageX: number, trackX: number) => {
    const w = trackWidthRef.current;
    if (w <= 0) return 0;
    return Math.max(0, Math.min(1, (pageX - trackX) / w));
  }, []);

  const trackXRef = useRef(0);

  const onSeekStart = useCallback((e: GestureResponderEvent) => {
    trackXRef.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
    const p = clampSeek(e.nativeEvent.pageX, trackXRef.current);
    setSeekProgress(p);
    return true;
  }, [clampSeek]);

  const onSeekMove = useCallback((e: GestureResponderEvent) => {
    const p = clampSeek(e.nativeEvent.pageX, trackXRef.current);
    setSeekProgress(p);
  }, [clampSeek]);

  const onSeekEnd = useCallback((e: GestureResponderEvent) => {
    const p = clampSeek(e.nativeEvent.pageX, trackXRef.current);
    setSeekProgress(null);
    const dur = usePlayerStore.getState().durationMs;
    const trackDur = usePlayerStore.getState().currentTrack?.duration ?? 0;
    const totalMs = dur > 0 ? dur : trackDur * 1000;
    if (totalMs > 0) seekTo(p * totalMs);
  }, [clampSeek, seekTo]);

  const dismissY = useSharedValue(0);
  const dismissStartY = useRef(0);
  const isDismissing = useRef(false);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);

  const dismissStyle = useAnimatedStyle(() => ({
    transform: [{translateY: dismissY.value}],
  }));

  const onDismissGrant = useCallback((e: GestureResponderEvent) => {
    dismissStartY.current = e.nativeEvent.pageY;
    isDismissing.current = false;
  }, []);

  const onDismissMove = useCallback((e: GestureResponderEvent) => {
    const dy = e.nativeEvent.pageY - dismissStartY.current;
    if (dy > 0) {
      dismissY.value = dy;
      isDismissing.current = dy > 100;
    }
  }, [dismissY]);

  const onDismissEnd = useCallback(() => {
    if (isDismissing.current) {
      dismissY.value = withTiming(800, {duration: 200}, () => {
        runOnJS(goBack)();
      });
    } else {
      dismissY.value = withSpring(0, {damping: 20, stiffness: 300});
    }
  }, [dismissY, goBack]);

  if (!track) {
    return (
      <View style={[styles.container, {backgroundColor: theme.paper}]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.btn}>
            <IconChevDown size={22} color={theme.ink} />
          </Pressable>
        </View>
        <View style={styles.artwork}>
          <Text style={[styles.emptyText, {color: theme.ink3}]}>
            No track selected
          </Text>
        </View>
      </View>
    );
  }

  const positionSec = positionMs / 1000;
  const totalSec = durationMs > 0 ? durationMs / 1000 : track.duration;
  const progress = totalSec > 0 ? positionSec / totalSec : 0;
  const isTrackLiked = liked(track.id);

  return (
    <Animated.View
      style={[
        styles.container,
        {backgroundColor: theme.paper},
        dismissStyle,
      ]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.btn}>
          <IconChevDown size={22} color={theme.ink} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={[styles.nowPlayingLabel, {color: theme.ink3}]}>
            NOW PLAYING
          </Text>
          <Text style={[styles.albumLabel, {color: theme.ink2}]}>
            from <Text style={{fontStyle: 'italic'}}>{track.album}</Text>
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

      <View
        style={styles.artwork}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onDismissGrant}
        onResponderMove={onDismissMove}
        onResponderRelease={onDismissEnd}
        onResponderTerminate={onDismissEnd}>
        {playerKind === 'vinyl' ? (
          <VinylPlayer
            isPlaying={isPlaying}
            progress={progress}
            albumName={track.album}
            artistName={track.artist}
            hue={track.hue}
            size={300}
          />
        ) : (
          <CassettePlayer
            isPlaying={isPlaying}
            progress={progress}
            trackTitle={track.title}
            artistName={track.artist}
            albumName={track.album}
            hue={track.hue}
            size={300}
            durationSec={totalSec}
          />
        )}
      </View>

      <View style={styles.titleBlock}>
        <Text style={[styles.title, {color: theme.ink}]}>{track.title}</Text>
        <View style={styles.subtitleRow}>
          <Text style={[styles.artist, {color: theme.ink3}]}>{track.artist}</Text>
          <View style={[styles.dot, {backgroundColor: theme.ink4}]} />
          <Text style={[styles.artist, {color: theme.ink3}]}>{track.year}</Text>
          <FlacChip />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View
          style={styles.progressHitArea}
          onLayout={onTrackLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={onSeekStart}
          onResponderMove={onSeekMove}
          onResponderRelease={onSeekEnd}
          onResponderTerminate={() => setSeekProgress(null)}>
          <View style={[styles.progressTrack, {backgroundColor: theme.ruleStrong}]}>
            <View
              style={[
                styles.progressFill,
                {backgroundColor: theme.accent, width: `${(seekProgress ?? progress) * 100}%`},
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                {
                  backgroundColor: theme.accent,
                  left: `${(seekProgress ?? progress) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.time, {color: theme.ink3}]}>
            {fmtTime(positionSec)}
          </Text>
          <Text style={[styles.time, {color: theme.ink3}]}>
            −{fmtTime(totalSec - positionSec)}
          </Text>
        </View>
      </View>

      <View style={styles.transport}>
        <Pressable style={styles.sideBtn} onPress={toggleShuffle}>
          <IconShuffle size={22} color={shuffle ? theme.accent : theme.ink3} />
        </Pressable>
        <Pressable style={styles.transportBtn} onPress={prev}>
          <IconPrev size={28} color={theme.ink} />
        </Pressable>
        <Pressable
          onPress={isPlaying ? pause : resume}
          style={[styles.playBtn, {backgroundColor: theme.ink}]}>
          {isPlaying ? (
            <IconPause size={28} color={theme.paper} />
          ) : (
            <IconPlay size={28} color={theme.paper} />
          )}
        </Pressable>
        <Pressable style={styles.transportBtn} onPress={next}>
          <IconNext size={28} color={theme.ink} />
        </Pressable>
        <Pressable style={styles.sideBtn} onPress={cycleRepeat}>
          <IconRepeat
            size={22}
            color={repeat !== 'off' ? theme.accent : theme.ink3}
          />
        </Pressable>
      </View>

      <View style={styles.bottomRow}>
        <Pressable style={styles.bottomBtn} onPress={() => toggleLike(track.id)}>
          {isTrackLiked ? (
            <IconHeartFilled size={20} color={theme.accent} />
          ) : (
            <IconHeart size={20} color={theme.ink3} />
          )}
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Equalizer')}
          style={styles.eqBtn}>
          <IconEQ size={16} color={theme.ink3} />
          <Text style={[styles.eqText, {color: theme.ink3}]}>
            EQ · {eqPreset.toUpperCase()}
          </Text>
        </Pressable>
        <Pressable style={styles.bottomBtn}>
          <IconMore size={20} color={theme.ink3} />
        </Pressable>
      </View>
    </Animated.View>
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
  progressHitArea: {
    paddingVertical: 14,
    justifyContent: 'center',
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
  emptyText: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 20,
  },
});
