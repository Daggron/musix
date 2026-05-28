import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {IconClose} from '../components';
import {useTheme, FONTS} from '../theme';
import {useEQStore, EQ_BANDS, EQ_PRESETS} from '../store';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
}

export function EqualizerScreen({navigation}: Props) {
  const theme = useTheme();
  const enabled = useEQStore((s) => s.enabled);
  const preset = useEQStore((s) => s.preset);
  const levels = useEQStore((s) => s.levels);
  const toggleEnabled = useEQStore((s) => s.toggleEnabled);
  const applyPreset = useEQStore((s) => s.applyPreset);

  return (
    <View style={[styles.container, {backgroundColor: theme.paper}]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, {color: theme.ink3}]}>
            10-BAND PARAMETRIC
          </Text>
          <Text style={[styles.title, {color: theme.ink}]}>Equalizer</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={toggleEnabled}
            style={[
              styles.toggle,
              {backgroundColor: enabled ? theme.accent : theme.ruleStrong},
            ]}>
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: theme.paper,
                  transform: [{translateX: enabled ? 18 : 0}],
                },
              ]}
            />
          </Pressable>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[
              styles.closeBtn,
              {backgroundColor: theme.card, borderColor: theme.ruleStrong},
            ]}>
            <IconClose size={18} color={theme.ink3} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetRow}>
        {Object.keys(EQ_PRESETS).map((p) => (
          <Pressable
            key={p}
            onPress={() => applyPreset(p)}
            style={[
              styles.presetChip,
              {
                backgroundColor: preset === p ? theme.ink : theme.card,
                borderColor: theme.ruleStrong,
              },
            ]}>
            <Text
              style={[
                styles.presetText,
                {color: preset === p ? theme.paper : theme.ink2},
              ]}>
              {p.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.sliders, {opacity: enabled ? 1 : 0.4}]}>
        {levels.map((v, i) => {
          const pct = (v + 6) / 12;
          const zeroPct = 6 / 12;
          return (
            <View key={i} style={styles.band}>
              <Text
                style={[
                  styles.bandValue,
                  {color: v >= 0 ? theme.ink2 : theme.ink3},
                ]}>
                {v >= 0 ? '+' : ''}
                {v}
              </Text>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderRail,
                    {backgroundColor: theme.ruleStrong},
                  ]}>
                  <View
                    style={[
                      styles.sliderFill,
                      {
                        backgroundColor: theme.accent,
                        top: v >= 0 ? `${(1 - pct) * 100}%` : `${(1 - zeroPct) * 100}%`,
                        bottom: v >= 0 ? `${zeroPct * 100}%` : `${pct * 100}%`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.zeroTick,
                      {
                        backgroundColor: theme.ruleStrong,
                        top: `${(1 - zeroPct) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <View
                  style={[
                    styles.sliderThumb,
                    {
                      backgroundColor: theme.paper,
                      borderColor: theme.accent,
                      top: `${(1 - pct) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.bandLabel, {color: theme.ink4}]}>
                {EQ_BANDS[i]}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerLabel, {color: theme.ink4}]}>
          OUTPUT · 24-BIT · 96 KHZ
        </Text>
        <Pressable onPress={() => applyPreset('Flat')}>
          <Text style={[styles.resetBtn, {color: theme.accent}]}>RESET</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  kicker: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.9,
  },
  title: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 30,
    lineHeight: 32,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 999,
    padding: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  presetText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sliders: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  band: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bandValue: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    minWidth: 28,
    textAlign: 'center',
  },
  sliderTrack: {
    flex: 1,
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180,
  },
  sliderRail: {
    width: 4,
    height: '100%',
    borderRadius: 999,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 999,
  },
  zeroTick: {
    position: 'absolute',
    left: -6,
    right: -6,
    height: 0.5,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignSelf: 'center',
    marginTop: -11,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  bandLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
  },
  resetBtn: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    paddingVertical: 6,
  },
});
