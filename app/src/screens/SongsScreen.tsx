import React, {useEffect} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {PageHeader, TrackRow, IconPlus, IconShuffle} from '../components';
import {useTheme, FONTS} from '../theme';
import {useLibraryStore, usePlayerStore} from '../store';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

const SORT_TABS = [
  {key: 'title' as const, label: 'Title'},
  {key: 'artist' as const, label: 'Artist'},
  {key: 'recent' as const, label: 'Recent'},
];

export function SongsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const tracks = useLibraryStore((s) => s.tracks);
  const sortMode = useLibraryStore((s) => s.sortMode);
  const setSortMode = useLibraryStore((s) => s.setSortMode);
  const loadLibrary = useLibraryStore((s) => s.loadLibrary);
  const loaded = useLibraryStore((s) => s.loaded);
  const play = usePlayerStore((s) => s.play);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    if (!loaded) loadLibrary();
  }, [loaded, loadLibrary]);

  const trackIds = tracks.map((t) => t.id);

  const handleShuffle = () => {
    if (tracks.length === 0) return;
    const shuffled = [...trackIds].sort(() => Math.random() - 0.5);
    usePlayerStore.getState().setQueue(shuffled, 0);
    navigation.navigate('NowPlaying');
  };

  return (
    <ScrollView
      style={[styles.scroll, {backgroundColor: theme.paper}]}
      contentContainerStyle={styles.content}>
      <PageHeader
        kicker={`${tracks.length} tracks · FLAC library`}
        title="Songs"
        right={
          <Pressable
            onPress={() => navigation.navigate('AddMusic')}
            style={[
              styles.addBtn,
              {backgroundColor: theme.card, borderColor: theme.ruleStrong},
            ]}>
            <IconPlus size={20} color={theme.ink} />
          </Pressable>
        }
      />

      <View style={styles.sortRow}>
        <View style={styles.sortTabs}>
          {SORT_TABS.map(({key, label}) => (
            <Pressable key={key} onPress={() => setSortMode(key)}>
              <Text
                style={[
                  styles.sortLabel,
                  {
                    color: sortMode === key ? theme.ink : theme.ink4,
                    borderBottomColor:
                      sortMode === key ? theme.accent : 'transparent',
                  },
                ]}>
                {label.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.shuffleBtn} onPress={handleShuffle}>
          <IconShuffle size={14} color={theme.accent} />
          <Text style={[styles.shuffleText, {color: theme.accent}]}>
            SHUFFLE ALL
          </Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isCurrent={currentTrack?.id === track.id}
            onPress={() => {
              play(track.id, trackIds);
              navigation.navigate('NowPlaying');
            }}
          />
        ))}
      </View>

      <Text style={[styles.footer, {color: theme.ink4}]}>
        — that's everything in the library —
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 50,
    paddingBottom: 180,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sortTabs: {
    flexDirection: 'row',
    gap: 14,
  },
  sortLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shuffleText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  list: {
    marginTop: 8,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 14,
  },
});
