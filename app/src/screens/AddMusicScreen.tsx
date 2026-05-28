import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {IconClose, IconUpload, IconFolder, IconPlus} from '../components';
import {useTheme, FONTS} from '../theme';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

const TABS = [
  {key: 'drop', label: 'DROP FILES'},
  {key: 'picker', label: 'FROM DEVICE'},
  {key: 'folder', label: 'WATCHED FOLDERS'},
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface Props {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
}

export function AddMusicScreen({navigation}: Props) {
  const theme = useTheme();
  const [tab, setTab] = useState<TabKey>('picker');

  return (
    <View style={[styles.container, {backgroundColor: theme.paper}]}>
      <View style={styles.grabber}>
        <View style={[styles.grabberBar, {backgroundColor: theme.ruleStrong}]} />
      </View>

      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, {color: theme.ink3}]}>
            ADD TO LIBRARY
          </Text>
          <Text style={[styles.title, {color: theme.ink}]}>More music</Text>
        </View>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[
            styles.closeBtn,
            {backgroundColor: theme.card, borderColor: theme.ruleStrong},
          ]}>
          <IconClose size={18} color={theme.ink3} />
        </Pressable>
      </View>

      <View style={[styles.tabRow, {borderBottomColor: theme.rule}]}>
        {TABS.map(({key, label}) => (
          <Pressable key={key} onPress={() => setTab(key)}>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: tab === key ? theme.ink : theme.ink4,
                  borderBottomColor:
                    tab === key ? theme.accent : 'transparent',
                },
              ]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.body}>
        {tab === 'drop' && (
          <View
            style={[styles.dropZone, {borderColor: theme.ruleStrong}]}>
            <View style={[styles.dropIcon, {backgroundColor: theme.card}]}>
              <IconUpload size={26} color={theme.ink3} />
            </View>
            <Text style={[styles.dropTitle, {color: theme.ink}]}>
              Drag FLAC files here
            </Text>
            <Text style={[styles.dropSub, {color: theme.ink3}]}>
              FLAC, ALAC, WAV, AIFF up to 24-bit / 192 kHz
            </Text>
          </View>
        )}

        {tab === 'picker' && (
          <View>
            <Text style={[styles.pickerTitle, {color: theme.ink}]}>
              Choose from your files
            </Text>
            <Text style={[styles.pickerSub, {color: theme.ink3}]}>
              Pick FLAC files from local storage, iCloud Drive, or another app.
            </Text>
            <Pressable
              style={[styles.openBtn, {backgroundColor: theme.ink}]}>
              <IconFolder size={16} color={theme.paper} />
              <Text style={[styles.openBtnText, {color: theme.paper}]}>
                OPEN FILES
              </Text>
            </Pressable>
            {[
              {label: 'iCloud Drive', detail: '2 albums staged'},
              {label: 'Bandcamp downloads', detail: '47 tracks'},
              {label: 'Recently added', detail: 'this week'},
            ].map((s) => (
              <View
                key={s.label}
                style={[styles.sourceRow, {borderBottomColor: theme.rule}]}>
                <View style={[styles.sourceIcon, {backgroundColor: theme.card}]}>
                  <IconFolder size={18} color={theme.ink3} />
                </View>
                <View style={styles.sourceInfo}>
                  <Text style={[styles.sourceLabel, {color: theme.ink}]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.sourceDetail, {color: theme.ink3}]}>
                    {s.detail}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'folder' && (
          <View>
            <Text style={[styles.pickerTitle, {color: theme.ink}]}>
              Watch a folder for changes
            </Text>
            <Text style={[styles.pickerSub, {color: theme.ink3}]}>
              Musix scans these folders and adds new FLAC files automatically.
            </Text>
            {[
              {path: '~/Music/FLAC Library', count: 1248, watching: true},
              {path: '~/Downloads/Bandcamp', count: 47, watching: false},
            ].map((f) => (
              <View
                key={f.path}
                style={[styles.sourceRow, {borderBottomColor: theme.rule}]}>
                <View
                  style={[
                    styles.sourceIcon,
                    {
                      backgroundColor: f.watching ? theme.accent : theme.card,
                    },
                  ]}>
                  <IconFolder
                    size={18}
                    color={f.watching ? theme.paper : theme.ink3}
                  />
                </View>
                <View style={styles.sourceInfo}>
                  <Text
                    numberOfLines={1}
                    style={[styles.folderPath, {color: theme.ink}]}>
                    {f.path}
                  </Text>
                  <Text style={[styles.sourceDetail, {color: theme.ink3}]}>
                    {f.count} tracks indexed{f.watching ? ' · watching' : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: f.watching
                        ? theme.accent
                        : theme.ruleStrong,
                    },
                  ]}>
                  <View
                    style={[
                      styles.toggleThumb,
                      {
                        backgroundColor: theme.paper,
                        transform: [{translateX: f.watching ? 18 : 0}],
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
            <Pressable
              style={[
                styles.addFolderBtn,
                {backgroundColor: theme.card, borderColor: theme.ruleStrong},
              ]}>
              <IconPlus size={14} color={theme.ink} />
              <Text style={[styles.addFolderText, {color: theme.ink}]}>
                ADD FOLDER
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grabber: {
    alignItems: 'center',
    paddingTop: 8,
  },
  grabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  kicker: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.9,
  },
  title: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 28,
    lineHeight: 30,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 0.5,
  },
  tabLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    paddingBottom: 10,
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  body: {
    padding: 20,
  },
  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
  },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  dropTitle: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 20,
  },
  dropSub: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  pickerTitle: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 18,
    marginBottom: 4,
  },
  pickerSub: {
    fontSize: 12,
    marginBottom: 16,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  openBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  sourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceLabel: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 15,
  },
  sourceDetail: {
    fontSize: 11,
  },
  folderPath: {
    fontFamily: FONTS.mono,
    fontSize: 12,
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
  addFolderBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderStyle: 'dashed',
  },
  addFolderText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
