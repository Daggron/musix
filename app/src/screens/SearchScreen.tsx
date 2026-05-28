import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {PageHeader, IconSearch, IconClose} from '../components';
import {useTheme, FONTS, hueToGradient} from '../theme';
import {GENRES} from '../data/mockData';

const RECENT_SEARCHES = ['Bill Evans', 'Kind of Blue', 'Late Night'];

export function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  return (
    <ScrollView
      style={[styles.scroll, {backgroundColor: theme.paper}]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <PageHeader
        title="Search"
        kicker="songs · artists · albums · playlists"
      />

      <View
        style={[
          styles.searchBar,
          {backgroundColor: theme.card, borderColor: theme.ruleStrong},
        ]}>
        <IconSearch size={18} color={theme.ink3} />
        <TextInput
          style={[styles.input, {color: theme.ink}]}
          placeholder="What do you want to hear?"
          placeholderTextColor={theme.ink4}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <IconClose size={14} color={theme.ink3} />
          </Pressable>
        )}
      </View>

      {!query && (
        <>
          <Text style={[styles.sectionHeader, {color: theme.ink3}]}>
            Recent searches
          </Text>
          <View style={styles.chips}>
            {RECENT_SEARCHES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setQuery(r)}
                style={[
                  styles.chip,
                  {backgroundColor: theme.card, borderColor: theme.ruleStrong},
                ]}>
                <Text style={[styles.chipText, {color: theme.ink2}]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionHeader, {color: theme.ink3}]}>
            Browse by genre
          </Text>
          <View style={styles.genreGrid}>
            {GENRES.map((g, i) => {
              const tall = i === 0 || i === 3;
              const [start, end] = hueToGradient(g.hue);
              return (
                <LinearGradient
                  key={g.label}
                  colors={[start, end]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={[
                    styles.genreTile,
                    {height: tall ? 132 : 76},
                  ]}>
                  <Text style={styles.genreLabel}>{g.label}</Text>
                </LinearGradient>
              );
            })}
          </View>
        </>
      )}

      {query.length > 0 && (
        <View style={styles.emptyResults}>
          <Text style={[styles.emptyTitle, {color: theme.ink3}]}>
            nothing here yet
          </Text>
          <Text style={[styles.emptySubtitle, {color: theme.ink4}]}>
            try a different word, or add more music
          </Text>
        </View>
      )}
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
  searchBar: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.sans,
    fontSize: 17,
    padding: 0,
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  chipText: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 13,
  },
  genreGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genreTile: {
    width: '47%',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  genreLabel: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: 'rgba(255,245,225,0.95)',
  },
  emptyResults: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 20,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 12,
  },
});
