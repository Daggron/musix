import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {PageHeader, TrackRow, IconPlus, IconShuffle} from '../components';
import {useTheme, FONTS} from '../theme';
import {SONGS} from '../data/mockData';

const SORT_TABS = [
  {key: 'title', label: 'Title'},
  {key: 'artist', label: 'Artist'},
  {key: 'recent', label: 'Recent'},
] as const;

type SortKey = (typeof SORT_TABS)[number]['key'];

export function SongsScreen() {
  const theme = useTheme();
  const [sort, setSort] = useState<SortKey>('title');

  const sorted = useMemo(() => {
    const arr = [...SONGS];
    if (sort === 'title') {
      arr.sort((a, b) => a.t.localeCompare(b.t));
    } else if (sort === 'artist') {
      arr.sort((a, b) => a.ar.localeCompare(b.ar));
    } else {
      arr.reverse();
    }
    return arr;
  }, [sort]);

  return (
    <ScrollView
      style={[styles.scroll, {backgroundColor: theme.paper}]}
      contentContainerStyle={styles.content}>
      <PageHeader
        kicker={`${SONGS.length} tracks · FLAC library`}
        title="Songs"
        right={
          <Pressable
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
            <Pressable key={key} onPress={() => setSort(key)}>
              <Text
                style={[
                  styles.sortLabel,
                  {
                    color: sort === key ? theme.ink : theme.ink4,
                    borderBottomColor:
                      sort === key ? theme.accent : 'transparent',
                  },
                ]}>
                {label.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.shuffleBtn}>
          <IconShuffle size={14} color={theme.accent} />
          <Text style={[styles.shuffleText, {color: theme.accent}]}>
            SHUFFLE ALL
          </Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {sorted.map((song) => (
          <TrackRow key={song.id} song={song} />
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
