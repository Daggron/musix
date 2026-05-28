import React, {useEffect} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  PageHeader,
  AlbumCover,
  IconPlus,
  IconHeartFilled,
  IconBack,
} from '../components';
import {useTheme, FONTS} from '../theme';
import {usePlaylistStore} from '../store';
import {getPlaylistTrackHues} from '../db';
import type {Playlist} from '../db';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {hueToGradient} from '../theme';

function PlaylistCover({
  playlist,
  size = 64,
}: {
  playlist: Playlist;
  size?: number;
}) {
  const hues = getPlaylistTrackHues(playlist.id, 4);

  if (hues.length === 0) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: '#f6ead0',
        }}
      />
    );
  }

  if (hues.length < 4) {
    return (
      <AlbumCover
        albumName={playlist.name}
        hue={hues[0]}
        size={size}
        radius={8}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        overflow: 'hidden',
        flexDirection: 'row',
        flexWrap: 'wrap',
      }}>
      {hues.slice(0, 4).map((h, i) => (
        <AlbumCover
          key={i}
          albumName=""
          hue={h}
          size={size / 2}
          radius={0}
        />
      ))}
    </View>
  );
}

interface Props {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
}

export function PlaylistsScreen({navigation}: Props) {
  const theme = useTheme();
  const playlists = usePlaylistStore((s) => s.playlists);
  const likedCount = usePlaylistStore((s) => s.likedCount);
  const loadPlaylists = usePlaylistStore((s) => s.loadPlaylists);
  const loadLiked = usePlaylistStore((s) => s.loadLiked);

  useEffect(() => {
    loadPlaylists();
    loadLiked();
  }, [loadPlaylists, loadLiked]);

  return (
    <ScrollView
      style={[styles.scroll, {backgroundColor: theme.paper}]}
      contentContainerStyle={styles.content}>
      <PageHeader
        title="Playlists"
        kicker={`${playlists.length} collections`}
        right={
          <Pressable
            onPress={() => {
              usePlaylistStore.getState().createPlaylist('New Playlist');
            }}
            style={[
              styles.addBtn,
              {backgroundColor: theme.card, borderColor: theme.ruleStrong},
            ]}>
            <IconPlus size={20} color={theme.ink} />
          </Pressable>
        }
      />

      <View style={styles.likedCard}>
        <Pressable
          style={[
            styles.likedRow,
            {backgroundColor: theme.card, borderColor: theme.ruleStrong},
          ]}>
          <LinearGradient
            colors={[theme.accent, theme.accentSoft]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.likedIcon}>
            <IconHeartFilled size={20} color="white" />
          </LinearGradient>
          <View style={styles.likedInfo}>
            <Text style={[styles.likedTitle, {color: theme.ink}]}>
              Liked Songs
            </Text>
            <Text style={[styles.likedSub, {color: theme.ink3}]}>
              {likedCount > 0 ? `${likedCount} tracks` : 'auto-collected favorites'}
            </Text>
          </View>
          <View style={{transform: [{rotate: '180deg'}]}}>
            <IconBack size={18} color={theme.ink3} />
          </View>
        </Pressable>
      </View>

      <Text style={[styles.sectionHeader, {color: theme.ink3}]}>
        Your playlists
      </Text>
      <View style={styles.playlists}>
        {playlists.map((pl) => (
          <Pressable
            key={pl.id}
            style={[styles.playlistRow, {borderBottomColor: theme.rule}]}
            onPress={() =>
              navigation.navigate('PlaylistDetail', {playlistId: pl.id})
            }>
            <PlaylistCover playlist={pl} size={64} />
            <View style={styles.playlistInfo}>
              <Text
                numberOfLines={1}
                style={[styles.playlistName, {color: theme.ink}]}>
                {pl.name}
              </Text>
              {pl.note ? (
                <Text
                  numberOfLines={1}
                  style={[styles.playlistNote, {color: theme.ink3}]}>
                  {pl.note}
                </Text>
              ) : null}
              <Text style={[styles.playlistCount, {color: theme.ink4}]}>
                {pl.trackCount} TRACKS
              </Text>
            </View>
            <View style={{transform: [{rotate: '180deg'}]}}>
              <IconBack size={16} color={theme.ink4} />
            </View>
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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedCard: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  likedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  likedIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedInfo: {
    flex: 1,
  },
  likedTitle: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 17,
  },
  likedSub: {
    fontSize: 11,
  },
  sectionHeader: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 13,
    letterSpacing: 0.3,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  playlists: {
    paddingHorizontal: 20,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  playlistInfo: {
    flex: 1,
    minWidth: 0,
  },
  playlistName: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 20,
  },
  playlistNote: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 12,
    marginTop: 2,
  },
  playlistCount: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: 1.1,
    marginTop: 3,
  },
});
