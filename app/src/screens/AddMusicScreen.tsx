import React, {useState, useCallback, useEffect} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {IconClose, IconUpload, IconFolder, IconPlus} from '../components';
import {useTheme, FONTS} from '../theme';
import {ScannerModule, type WatchedFolder} from '@musix/audio-engine';
import {insertTrack} from '../db';
import {useLibraryStore} from '../store';
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

function generateTrackId(filePath: string): string {
  let hash = 0;
  for (let i = 0; i < filePath.length; i++) {
    hash = (hash * 31 + filePath.charCodeAt(i)) | 0;
  }
  return `trk_${Math.abs(hash).toString(36)}`;
}

export function AddMusicScreen({navigation}: Props) {
  const theme = useTheme();
  const [tab, setTab] = useState<TabKey>('picker');
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [watchedFolders, setWatchedFolders] = useState<WatchedFolder[]>([]);
  const loadLibrary = useLibraryStore((s) => s.loadLibrary);

  useEffect(() => {
    setWatchedFolders(ScannerModule.getWatchedFolders());
  }, []);

  const importAndInsert = useCallback(async (filePaths: string[]) => {
    let count = 0;
    for (const fp of filePaths) {
      try {
        const meta = await ScannerModule.getMetadata(fp);
        insertTrack({
          id: generateTrackId(fp),
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          year: meta.year,
          duration: meta.duration,
          bitrate: meta.bitrate,
          genre: meta.genre,
          hue: meta.hue,
          filePath: meta.filePath,
        });
        count++;
      } catch {}
    }
    return count;
  }, []);

  const handleImportFiles = useCallback(async () => {
    setImporting(true);
    setImportCount(0);
    try {
      const paths = await ScannerModule.importFiles();
      if (paths.length > 0) {
        const count = await importAndInsert(paths);
        setImportCount(count);
        loadLibrary();
      }
    } finally {
      setImporting(false);
    }
  }, [importAndInsert, loadLibrary]);

  const handleAddFolder = useCallback(async () => {
    const bookmarkId = await ScannerModule.addWatchedFolder();
    if (bookmarkId) {
      setWatchedFolders(ScannerModule.getWatchedFolders());
      setImporting(true);
      try {
        const paths = await ScannerModule.scanFolder(bookmarkId);
        if (paths.length > 0) {
          const count = await importAndInsert(paths);
          setImportCount(count);
          loadLibrary();
        }
      } finally {
        setImporting(false);
      }
    }
  }, [importAndInsert, loadLibrary]);

  const handleRemoveFolder = useCallback(
    (bookmarkId: string) => {
      ScannerModule.removeWatchedFolder(bookmarkId);
      setWatchedFolders(ScannerModule.getWatchedFolders());
    },
    [],
  );

  const handleRescanFolder = useCallback(
    async (bookmarkId: string) => {
      setImporting(true);
      try {
        const paths = await ScannerModule.scanFolder(bookmarkId);
        if (paths.length > 0) {
          const count = await importAndInsert(paths);
          setImportCount(count);
          loadLibrary();
        }
      } finally {
        setImporting(false);
      }
    },
    [importAndInsert, loadLibrary],
  );

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
              onPress={handleImportFiles}
              disabled={importing}
              style={[styles.openBtn, {backgroundColor: theme.ink, opacity: importing ? 0.6 : 1}]}>
              {importing ? (
                <ActivityIndicator size="small" color={theme.paper} />
              ) : (
                <IconFolder size={16} color={theme.paper} />
              )}
              <Text style={[styles.openBtnText, {color: theme.paper}]}>
                {importing ? 'IMPORTING...' : 'OPEN FILES'}
              </Text>
            </Pressable>
            {importCount > 0 && (
              <Text style={[styles.importStatus, {color: theme.accent}]}>
                {importCount} track{importCount !== 1 ? 's' : ''} imported
              </Text>
            )}
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
            {watchedFolders.map((f) => (
              <View
                key={f.id}
                style={[styles.sourceRow, {borderBottomColor: theme.rule}]}>
                <View
                  style={[styles.sourceIcon, {backgroundColor: theme.accent}]}>
                  <IconFolder size={18} color={theme.paper} />
                </View>
                <View style={styles.sourceInfo}>
                  <Text
                    numberOfLines={1}
                    style={[styles.folderPath, {color: theme.ink}]}>
                    {f.path}
                  </Text>
                  <Pressable onPress={() => handleRescanFolder(f.id)}>
                    <Text style={[styles.sourceDetail, {color: theme.accent}]}>
                      Tap to rescan
                    </Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => handleRemoveFolder(f.id)}>
                  <IconClose size={16} color={theme.ink3} />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={handleAddFolder}
              disabled={importing}
              style={[
                styles.addFolderBtn,
                {backgroundColor: theme.card, borderColor: theme.ruleStrong, opacity: importing ? 0.6 : 1},
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
  importStatus: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 10,
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
