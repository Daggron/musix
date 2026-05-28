import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {
  AlbumCover,
  IconBack,
  IconPlay,
  IconShuffle,
  IconDrag,
} from '../components';
import {useTheme, FONTS} from '../theme';
import {PLAYLISTS, SONGS, fmtTime} from '../data/mockData';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';

interface Props {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
  route: RouteProp<{PlaylistDetail: {playlistId: string}}, 'PlaylistDetail'>;
}

export function PlaylistDetailScreen({navigation, route}: Props) {
  const theme = useTheme();
  const playlist = PLAYLISTS.find(
    (p) => p.id === route.params.playlistId,
  );

  if (!playlist) {
    return null;
  }

  const items = playlist.songIds
    .map((id) => SONGS.find((s) => s.id === id))
    .filter(Boolean);
  const totalSeconds = items.reduce((a, s) => a + s!.d, 0);

  return (
    <ScrollView
      style={[styles.scroll, {backgroundColor: theme.paper}]}
      contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <IconBack size={22} color={theme.ink} />
        </Pressable>
        <Pressable>
          <Text style={[styles.deleteBtn, {color: theme.accent}]}>DELETE</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.coverWrap}>
          {items.length >= 4 ? (
            <View style={styles.mosaic}>
              {items.slice(0, 4).map((s, i) => (
                <AlbumCover
                  key={i}
                  albumName={s!.al}
                  hue={s!.hue}
                  size={80}
                  radius={0}
                />
              ))}
            </View>
          ) : items.length > 0 ? (
            <AlbumCover
              albumName={items[0]!.al}
              hue={items[0]!.hue}
              size={160}
              radius={8}
            />
          ) : (
            <View
              style={[styles.emptyCover, {backgroundColor: theme.cardSoft}]}
            />
          )}
        </View>
        <Text style={[styles.playlistName, {color: theme.ink}]}>
          {playlist.name}
        </Text>
        {playlist.note && (
          <Text style={[styles.playlistNote, {color: theme.ink3}]}>
            {playlist.note}
          </Text>
        )}
        <Text style={[styles.meta, {color: theme.ink4}]}>
          {items.length} TRACKS · {Math.round(totalSeconds / 60)} MIN
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.playBtn, {backgroundColor: theme.ink}]}>
          <IconPlay size={14} color={theme.paper} />
          <Text style={[styles.actionText, {color: theme.paper}]}>PLAY</Text>
        </Pressable>
        <Pressable
          style={[
            styles.shuffleBtn,
            {backgroundColor: theme.card, borderColor: theme.ruleStrong},
          ]}>
          <IconShuffle size={14} color={theme.ink} />
          <Text style={[styles.actionText, {color: theme.ink}]}>SHUFFLE</Text>
        </Pressable>
      </View>

      <View style={styles.trackList}>
        {items.map((s) => (
          <Pressable
            key={s!.id}
            style={[styles.trackRow, {borderBottomColor: theme.rule}]}>
            <IconDrag size={14} color={theme.ink4} />
            <AlbumCover
              albumName={s!.al}
              hue={s!.hue}
              size={36}
              radius={4}
            />
            <View style={styles.trackInfo}>
              <Text
                numberOfLines={1}
                style={[styles.trackTitle, {color: theme.ink}]}>
                {s!.t}
              </Text>
              <Text style={[styles.trackArtist, {color: theme.ink3}]}>
                {s!.ar}
              </Text>
            </View>
            <Text style={[styles.trackDuration, {color: theme.ink3}]}>
              {fmtTime(s!.d)}
            </Text>
          </Pressable>
        ))}
      </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    padding: 8,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  coverWrap: {
    marginBottom: 16,
  },
  mosaic: {
    width: 160,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCover: {
    width: 160,
    height: 160,
    borderRadius: 8,
  },
  playlistName: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 30,
    textAlign: 'center',
  },
  playlistNote: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 13,
    marginTop: 4,
  },
  meta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  playBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
  },
  shuffleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  actionText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  trackList: {
    marginTop: 8,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 18,
  },
  trackArtist: {
    fontSize: 11,
  },
  trackDuration: {
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
});
