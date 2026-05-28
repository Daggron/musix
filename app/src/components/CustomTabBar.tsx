import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {IconSongs, IconSearch, IconPlaylists} from './Icons';
import {useTheme, FONTS} from '../theme';

const TAB_ICONS: Record<string, React.ComponentType<{size?: number; color?: string; strokeWidth?: number}>> = {
  Songs: IconSongs,
  Search: IconSearch,
  Playlists: IconPlaylists,
};

export function CustomTabBar({state, navigation}: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={['transparent', theme.paper]}
        style={styles.fade}
        pointerEvents="none"
      />
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.paper,
            borderTopColor: theme.rule,
            paddingBottom: insets.bottom || 20,
          },
        ]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = TAB_ICONS[route.name];
          const color = focused ? theme.accent : theme.ink3;

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}>
              {Icon && (
                <Icon
                  size={22}
                  color={color}
                  strokeWidth={focused ? 1.8 : 1.5}
                />
              )}
              <Text style={[styles.label, {color}]}>
                {route.name.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    height: 30,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.3,
    marginTop: 2,
  },
});
