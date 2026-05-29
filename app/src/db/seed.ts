import {getDb} from './connection';
import {insertTrack} from './tracks';
import {createPlaylist, addTrackToPlaylist} from './playlists';

const SEED_TRACKS = [
  {id: 'a1b2c3d4-0001-4000-8000-000000000001', title: 'Peace Piece', artist: 'Bill Evans', album: 'Everybody Digs Bill Evans', year: 1958, duration: 396, bitrate: 1411, genre: 'Jazz', hue: 28},
  {id: 'a1b2c3d4-0002-4000-8000-000000000002', title: 'Naima', artist: 'John Coltrane', album: 'Giant Steps', year: 1960, duration: 266, bitrate: 1411, genre: 'Jazz', hue: 12},
  {id: 'a1b2c3d4-0003-4000-8000-000000000003', title: 'Blue in Green', artist: 'Miles Davis', album: 'Kind of Blue', year: 1959, duration: 337, bitrate: 1411, genre: 'Jazz', hue: 215},
  {id: 'a1b2c3d4-0004-4000-8000-000000000004', title: 'Gymnopédie No. 1', artist: 'Erik Satie', album: 'Trois Gymnopédies', year: 1888, duration: 198, bitrate: 1411, genre: 'Classical', hue: 40},
  {id: 'a1b2c3d4-0005-4000-8000-000000000005', title: 'Clair de Lune', artist: 'Claude Debussy', album: 'Suite Bergamasque', year: 1905, duration: 318, bitrate: 1411, genre: 'Classical', hue: 200},
  {id: 'a1b2c3d4-0006-4000-8000-000000000006', title: 'Round Midnight', artist: 'Thelonious Monk', album: "Monk's Music", year: 1957, duration: 411, bitrate: 1411, genre: 'Jazz', hue: 8},
  {id: 'a1b2c3d4-0007-4000-8000-000000000007', title: 'Pink Moon', artist: 'Nick Drake', album: 'Pink Moon', year: 1972, duration: 122, bitrate: 1411, genre: 'Folk', hue: 350},
  {id: 'a1b2c3d4-0008-4000-8000-000000000008', title: 'Café 1930', artist: 'Astor Piazzolla', album: 'Histoire du Tango', year: 1986, duration: 432, bitrate: 1411, genre: 'Tango', hue: 18},
  {id: 'a1b2c3d4-0009-4000-8000-000000000009', title: 'Lonely Woman', artist: 'Ornette Coleman', album: 'The Shape of Jazz', year: 1959, duration: 309, bitrate: 1411, genre: 'Jazz', hue: 350},
  {id: 'a1b2c3d4-0010-4000-8000-000000000010', title: 'So What', artist: 'Miles Davis', album: 'Kind of Blue', year: 1959, duration: 562, bitrate: 1411, genre: 'Jazz', hue: 210},
  {id: 'a1b2c3d4-0011-4000-8000-000000000011', title: 'Waltz for Debby', artist: 'Bill Evans', album: 'Sunday at the Village Vanguard', year: 1961, duration: 408, bitrate: 1411, genre: 'Jazz', hue: 24},
  {id: 'a1b2c3d4-0012-4000-8000-000000000012', title: 'Take Five', artist: 'Dave Brubeck', album: 'Time Out', year: 1959, duration: 324, bitrate: 1411, genre: 'Jazz', hue: 32},
  {id: 'a1b2c3d4-0013-4000-8000-000000000013', title: 'Spiegel im Spiegel', artist: 'Arvo Pärt', album: 'Alina', year: 1999, duration: 530, bitrate: 1411, genre: 'Classical', hue: 195},
  {id: 'a1b2c3d4-0014-4000-8000-000000000014', title: 'Nuages', artist: 'Django Reinhardt', album: 'Nuages', year: 1940, duration: 199, bitrate: 1411, genre: 'Jazz', hue: 36},
  {id: 'a1b2c3d4-0015-4000-8000-000000000015', title: 'A Love Supreme, Pt. 1', artist: 'John Coltrane', album: 'A Love Supreme', year: 1965, duration: 472, bitrate: 1411, genre: 'Jazz', hue: 14},
  {id: 'a1b2c3d4-0016-4000-8000-000000000016', title: 'The Köln Concert, Pt. IIc', artist: 'Keith Jarrett', album: 'The Köln Concert', year: 1975, duration: 411, bitrate: 1411, genre: 'Jazz', hue: 28},
  {id: 'a1b2c3d4-0017-4000-8000-000000000017', title: 'Strange Fruit', artist: 'Billie Holiday', album: 'Commodore Master Takes', year: 1939, duration: 192, bitrate: 1411, genre: 'Vocal', hue: 0},
  {id: 'a1b2c3d4-0018-4000-8000-000000000018', title: 'Goodbye Pork Pie Hat', artist: 'Charles Mingus', album: 'Mingus Ah Um', year: 1959, duration: 343, bitrate: 1411, genre: 'Jazz', hue: 22},
  {id: 'a1b2c3d4-0019-4000-8000-000000000019', title: 'Maple Leaf Rag', artist: 'Scott Joplin', album: 'King of Ragtime', year: 1899, duration: 187, bitrate: 1411, genre: 'Ragtime', hue: 42},
  {id: 'a1b2c3d4-0020-4000-8000-000000000020', title: 'Wave', artist: 'Antônio Carlos Jobim', album: 'Wave', year: 1967, duration: 173, bitrate: 1411, genre: 'Bossa', hue: 130},
  {id: 'a1b2c3d4-0021-4000-8000-000000000021', title: 'Desafinado', artist: 'Stan Getz', album: 'Jazz Samba', year: 1962, duration: 354, bitrate: 1411, genre: 'Bossa', hue: 140},
  {id: 'a1b2c3d4-0022-4000-8000-000000000022', title: 'Solea', artist: 'Miles Davis', album: 'Sketches of Spain', year: 1960, duration: 738, bitrate: 1411, genre: 'Jazz', hue: 18},
  {id: 'a1b2c3d4-0023-4000-8000-000000000023', title: 'Mood Indigo', artist: 'Duke Ellington', album: 'Solos, Duets, and Trios', year: 1930, duration: 215, bitrate: 1411, genre: 'Jazz', hue: 225},
  {id: 'a1b2c3d4-0024-4000-8000-000000000024', title: 'Misty', artist: 'Erroll Garner', album: 'Contrasts', year: 1954, duration: 198, bitrate: 1411, genre: 'Jazz', hue: 195},
  {id: 'a1b2c3d4-0025-4000-8000-000000000025', title: 'Body and Soul', artist: 'Coleman Hawkins', album: 'Body and Soul', year: 1939, duration: 181, bitrate: 1411, genre: 'Jazz', hue: 348},
  {id: 'a1b2c3d4-0026-4000-8000-000000000026', title: 'Cello Suite No. 1 - Prelude', artist: 'J.S. Bach', album: 'Cello Suites', year: 1717, duration: 156, bitrate: 1411, genre: 'Classical', hue: 38},
  {id: 'a1b2c3d4-0027-4000-8000-000000000027', title: 'Nocturne Op. 9 No. 2', artist: 'Frédéric Chopin', album: 'Nocturnes', year: 1832, duration: 257, bitrate: 1411, genre: 'Classical', hue: 30},
  {id: 'a1b2c3d4-0028-4000-8000-000000000028', title: 'Hallelujah Junction, I', artist: 'John Adams', album: 'Hallelujah Junction', year: 1996, duration: 264, bitrate: 1411, genre: 'Modern', hue: 220},
  {id: 'a1b2c3d4-0029-4000-8000-000000000029', title: 'Goldberg Variations - Aria', artist: 'Glenn Gould', album: 'Goldberg Variations (1981)', year: 1981, duration: 213, bitrate: 1411, genre: 'Classical', hue: 36},
  {id: 'a1b2c3d4-0030-4000-8000-000000000030', title: 'River Man', artist: 'Nick Drake', album: 'Five Leaves Left', year: 1969, duration: 256, bitrate: 1411, genre: 'Folk', hue: 18},
  {id: 'a1b2c3d4-0031-4000-8000-000000000031', title: 'These Days', artist: 'Jackson Browne', album: 'For Everyman', year: 1973, duration: 269, bitrate: 1411, genre: 'Folk', hue: 28},
  {id: 'a1b2c3d4-0032-4000-8000-000000000032', title: 'Pancho and Lefty', artist: 'Townes Van Zandt', album: 'The Late Great', year: 1972, duration: 234, bitrate: 1411, genre: 'Folk', hue: 22},
  {id: 'a1b2c3d4-0033-4000-8000-000000000033', title: 'If I Were a Carpenter', artist: 'Tim Hardin', album: 'Tim Hardin 2', year: 1967, duration: 145, bitrate: 1411, genre: 'Folk', hue: 14},
  {id: 'a1b2c3d4-0034-4000-8000-000000000034', title: 'Both Sides Now', artist: 'Joni Mitchell', album: 'Clouds', year: 1969, duration: 256, bitrate: 1411, genre: 'Folk', hue: 32},
  {id: 'a1b2c3d4-0035-4000-8000-000000000035', title: 'Pavane pour une infante défunte', artist: 'Maurice Ravel', album: 'Solo Piano Works', year: 1899, duration: 369, bitrate: 1411, genre: 'Classical', hue: 8},
  {id: 'a1b2c3d4-0036-4000-8000-000000000036', title: 'Sketch 1 for Solo Piano', artist: 'Nils Frahm', album: 'Spaces', year: 2013, duration: 261, bitrate: 1411, genre: 'Modern', hue: 200},
  {id: 'a1b2c3d4-0037-4000-8000-000000000037', title: 'Avril 14th', artist: 'Aphex Twin', album: 'Drukqs', year: 2001, duration: 124, bitrate: 1411, genre: 'Electronic', hue: 280},
  {id: 'a1b2c3d4-0038-4000-8000-000000000038', title: "Une Barque sur l'Océan", artist: 'Maurice Ravel', album: 'Miroirs', year: 1906, duration: 472, bitrate: 1411, genre: 'Classical', hue: 215},
  {id: 'a1b2c3d4-0039-4000-8000-000000000039', title: 'Lágrima', artist: 'Francisco Tárrega', album: 'Guitar Works', year: 1881, duration: 132, bitrate: 1411, genre: 'Classical', hue: 16},
  {id: 'a1b2c3d4-0040-4000-8000-000000000040', title: 'Sketches from a Dead City', artist: 'Hauschka', album: 'Salon des Amateurs', year: 2011, duration: 312, bitrate: 1411, genre: 'Modern', hue: 250},
];

const ID_MAP: Record<string, string> = {};
SEED_TRACKS.forEach((t, i) => {
  ID_MAP[`s${i + 1}`] = t.id;
});

const SEED_PLAYLISTS = [
  {id: 'b2c3d4e5-0001-4000-8000-000000000001', name: 'Late Night Listening', note: 'for the quiet hours', songKeys: ['s1', 's11', 's24', 's23', 's5', 's13', 's27', 's36']},
  {id: 'b2c3d4e5-0002-4000-8000-000000000002', name: 'Sunday Coffee', note: 'slow start to the day', songKeys: ['s4', 's7', 's30', 's31', 's34', 's20', 's29', 's39']},
  {id: 'b2c3d4e5-0003-4000-8000-000000000003', name: 'Rainy Afternoon', note: 'for the window seat', songKeys: ['s13', 's37', 's38', 's35', 's40', 's36', 's5']},
  {id: 'b2c3d4e5-0004-4000-8000-000000000004', name: 'First Take', note: 'the recordings that started it all', songKeys: ['s17', 's19', 's25', 's23', 's14', 's18']},
  {id: 'b2c3d4e5-0005-4000-8000-000000000005', name: 'Café del Sur', note: 'with a sliver of orange peel', songKeys: ['s8', 's20', 's21', 's14', 's39']},
];

export function seedIfEmpty(): void {
  const db = getDb();
  const {rows} = db.executeSync('SELECT COUNT(*) AS count FROM tracks');
  if ((rows[0]?.count as number) > 0) return;

  for (const t of SEED_TRACKS) {
    insertTrack({...t, filePath: null, artworkPath: null});
  }

  for (const p of SEED_PLAYLISTS) {
    createPlaylist(p.id, p.name, p.note);
    for (const key of p.songKeys) {
      const trackId = ID_MAP[key];
      if (trackId) {
        addTrackToPlaylist(p.id, trackId);
      }
    }
  }
}

export {ID_MAP as MOCK_ID_MAP};
