import React, {useCallback, useEffect} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {PageHeader, TrackRow, IconPlus, IconShuffle, IconUpload} from '../components';
import {useTheme, FONTS} from '../theme';
import {useLibraryStore, usePlayerStore} from '../store';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {Track} from '../db';

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

  const renderItem = useCallback(
    ({item}: {item: Track}) => (
      <TrackRow
        key={item.id}
        track={item}
        isCurrent={currentTrack?.id === item.id}
        onPress={() => {
          play(item.id, trackIds);
          navigation.navigate('NowPlaying');
        }}
      />
    ),
    [currentTrack?.id, play, trackIds, navigation],
  );

  const header = (
    <>
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
        {tracks.length > 0 && (
          <Pressable style={styles.shuffleBtn} onPress={handleShuffle}>
            <IconShuffle size={14} color={theme.accent} />
            <Text style={[styles.shuffleText, {color: theme.accent}]}>
              SHUFFLE ALL
            </Text>
          </Pressable>
        )}
      </View>
    </>
  );

  if (tracks.length === 0) {
    return (
      <View style={[styles.scroll, {backgroundColor: theme.paper}]}>
        <View style={styles.content}>
          {header}
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, {backgroundColor: theme.card}]}>
              <IconUpload size={28} color={theme.ink3} />
            </View>
            <Text style={[styles.emptyTitle, {color: theme.ink}]}>
              Your library is empty
            </Text>
            <Text style={[styles.emptySub, {color: theme.ink3}]}>
              Add FLAC files to start listening
            </Text>
            <Pressable
              onPress={() => navigation.navigate('AddMusic')}
              style={[styles.emptyBtn, {backgroundColor: theme.ink}]}>
              <Text style={[styles.emptyBtnText, {color: theme.paper}]}>
                ADD MUSIC
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.scroll, {backgroundColor: theme.paper}]}>
      <FlashList
        data={tracks}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={
          <Text style={[styles.footer, {color: theme.ink4}]}>
            — that's everything in the library —
          </Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  listContent: {
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
  footer: {
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 22,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
