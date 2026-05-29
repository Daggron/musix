import React, {useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {
  AlbumCover,
  IconBack,
  IconPlay,
  IconShuffle,
  IconDrag,
} from '../components';
import {useTheme, FONTS} from '../theme';
import {usePlaylistStore, usePlayerStore} from '../store';
import {fmtTime} from '../utils';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';

interface Props {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
  route: RouteProp<{PlaylistDetail: {playlistId: string}}, 'PlaylistDetail'>;
}

export function PlaylistDetailScreen({navigation, route}: Props) {
  const theme = useTheme();
  const getPlaylistDetail = usePlaylistStore((s) => s.getPlaylistDetail);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const play = usePlayerStore((s) => s.play);

  const detail = useMemo(
    () => getPlaylistDetail(route.params.playlistId),
    [getPlaylistDetail, route.params.playlistId],
  );

  if (!detail) {
    return null;
  }

  const {name, note, tracks} = detail;
  const totalSeconds = tracks.reduce((a, t) => a + t.duration, 0);
  const trackIds = tracks.map((t) => t.id);

  const handlePlay = () => {
    if (trackIds.length === 0) return;
    usePlayerStore.getState().setQueue(trackIds, 0);
    navigation.getParent()?.navigate('NowPlaying');
  };

  const handleShuffle = () => {
    if (trackIds.length === 0) return;
    const shuffled = [...trackIds].sort(() => Math.random() - 0.5);
    usePlayerStore.getState().setQueue(shuffled, 0);
    navigation.getParent()?.navigate('NowPlaying');
  };

  const handleDelete = () => {
    deletePlaylist(route.params.playlistId);
    navigation.goBack();
  };

  return (
    <ScrollView
      style={[styles.scroll, {backgroundColor: theme.paper}]}
      contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <IconBack size={22} color={theme.ink} />
        </Pressable>
        <Pressable onPress={handleDelete}>
          <Text style={[styles.deleteBtn, {color: theme.accent}]}>DELETE</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.coverWrap}>
          {tracks.length >= 4 ? (
            <View style={styles.mosaic}>
              {tracks.slice(0, 4).map((t, i) => (
                <AlbumCover
                  key={i}
                  albumName={t.album}
                  hue={t.hue}
                  size={80}
                  radius={0}
                  artworkPath={t.artworkPath}
                />
              ))}
            </View>
          ) : tracks.length > 0 ? (
            <AlbumCover
              albumName={tracks[0].album}
              hue={tracks[0].hue}
              size={160}
              radius={8}
              artworkPath={tracks[0].artworkPath}
            />
          ) : (
            <View
              style={[styles.emptyCover, {backgroundColor: theme.cardSoft}]}
            />
          )}
        </View>
        <Text style={[styles.playlistName, {color: theme.ink}]}>
          {name}
        </Text>
        {note ? (
          <Text style={[styles.playlistNote, {color: theme.ink3}]}>
            {note}
          </Text>
        ) : null}
        <Text style={[styles.meta, {color: theme.ink4}]}>
          {tracks.length} TRACKS · {Math.round(totalSeconds / 60)} MIN
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handlePlay}
          style={[styles.playBtn, {backgroundColor: theme.ink}]}>
          <IconPlay size={14} color={theme.paper} />
          <Text style={[styles.actionText, {color: theme.paper}]}>PLAY</Text>
        </Pressable>
        <Pressable
          onPress={handleShuffle}
          style={[
            styles.shuffleBtn,
            {backgroundColor: theme.card, borderColor: theme.ruleStrong},
          ]}>
          <IconShuffle size={14} color={theme.ink} />
          <Text style={[styles.actionText, {color: theme.ink}]}>SHUFFLE</Text>
        </Pressable>
      </View>

      <View style={styles.trackList}>
        {tracks.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => {
              play(t.id, trackIds);
              navigation.getParent()?.navigate('NowPlaying');
            }}
            style={[styles.trackRow, {borderBottomColor: theme.rule}]}>
            <IconDrag size={14} color={theme.ink4} />
            <AlbumCover
              albumName={t.album}
              hue={t.hue}
              size={36}
              radius={4}
              artworkPath={t.artworkPath}
            />
            <View style={styles.trackInfo}>
              <Text
                numberOfLines={1}
                style={[styles.trackTitle, {color: theme.ink}]}>
                {t.title}
              </Text>
              <Text style={[styles.trackArtist, {color: theme.ink3}]}>
                {t.artist}
              </Text>
            </View>
            <Text style={[styles.trackDuration, {color: theme.ink3}]}>
              {fmtTime(t.duration)}
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
