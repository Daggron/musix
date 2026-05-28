export interface Song {
  id: string;
  t: string;
  ar: string;
  al: string;
  y: number;
  d: number;
  br: number;
  gen: string;
  hue: number;
}

export interface Playlist {
  id: string;
  name: string;
  note: string;
  songIds: string[];
}

export const SONGS: Song[] = [
  {id: 's1', t: 'Peace Piece', ar: 'Bill Evans', al: 'Everybody Digs Bill Evans', y: 1958, d: 396, br: 1411, gen: 'Jazz', hue: 28},
  {id: 's2', t: 'Naima', ar: 'John Coltrane', al: 'Giant Steps', y: 1960, d: 266, br: 1411, gen: 'Jazz', hue: 12},
  {id: 's3', t: 'Blue in Green', ar: 'Miles Davis', al: 'Kind of Blue', y: 1959, d: 337, br: 1411, gen: 'Jazz', hue: 215},
  {id: 's4', t: 'Gymnopédie No. 1', ar: 'Erik Satie', al: 'Trois Gymnopédies', y: 1888, d: 198, br: 1411, gen: 'Classical', hue: 40},
  {id: 's5', t: 'Clair de Lune', ar: 'Claude Debussy', al: 'Suite Bergamasque', y: 1905, d: 318, br: 1411, gen: 'Classical', hue: 200},
  {id: 's6', t: 'Round Midnight', ar: 'Thelonious Monk', al: "Monk's Music", y: 1957, d: 411, br: 1411, gen: 'Jazz', hue: 8},
  {id: 's7', t: 'Pink Moon', ar: 'Nick Drake', al: 'Pink Moon', y: 1972, d: 122, br: 1411, gen: 'Folk', hue: 350},
  {id: 's8', t: 'Café 1930', ar: 'Astor Piazzolla', al: 'Histoire du Tango', y: 1986, d: 432, br: 1411, gen: 'Tango', hue: 18},
  {id: 's9', t: 'Lonely Woman', ar: 'Ornette Coleman', al: 'The Shape of Jazz', y: 1959, d: 309, br: 1411, gen: 'Jazz', hue: 350},
  {id: 's10', t: 'So What', ar: 'Miles Davis', al: 'Kind of Blue', y: 1959, d: 562, br: 1411, gen: 'Jazz', hue: 210},
  {id: 's11', t: 'Waltz for Debby', ar: 'Bill Evans', al: 'Sunday at the Village Vanguard', y: 1961, d: 408, br: 1411, gen: 'Jazz', hue: 24},
  {id: 's12', t: 'Take Five', ar: 'Dave Brubeck', al: 'Time Out', y: 1959, d: 324, br: 1411, gen: 'Jazz', hue: 32},
  {id: 's13', t: 'Spiegel im Spiegel', ar: 'Arvo Pärt', al: 'Alina', y: 1999, d: 530, br: 1411, gen: 'Classical', hue: 195},
  {id: 's14', t: 'Nuages', ar: 'Django Reinhardt', al: 'Nuages', y: 1940, d: 199, br: 1411, gen: 'Jazz', hue: 36},
  {id: 's15', t: 'A Love Supreme, Pt. 1', ar: 'John Coltrane', al: 'A Love Supreme', y: 1965, d: 472, br: 1411, gen: 'Jazz', hue: 14},
  {id: 's16', t: 'The Köln Concert, Pt. IIc', ar: 'Keith Jarrett', al: 'The Köln Concert', y: 1975, d: 411, br: 1411, gen: 'Jazz', hue: 28},
  {id: 's17', t: 'Strange Fruit', ar: 'Billie Holiday', al: 'Commodore Master Takes', y: 1939, d: 192, br: 1411, gen: 'Vocal', hue: 0},
  {id: 's18', t: 'Goodbye Pork Pie Hat', ar: 'Charles Mingus', al: 'Mingus Ah Um', y: 1959, d: 343, br: 1411, gen: 'Jazz', hue: 22},
  {id: 's19', t: 'Maple Leaf Rag', ar: 'Scott Joplin', al: 'King of Ragtime', y: 1899, d: 187, br: 1411, gen: 'Ragtime', hue: 42},
  {id: 's20', t: 'Wave', ar: 'Antônio Carlos Jobim', al: 'Wave', y: 1967, d: 173, br: 1411, gen: 'Bossa', hue: 130},
  {id: 's21', t: 'Desafinado', ar: 'Stan Getz', al: 'Jazz Samba', y: 1962, d: 354, br: 1411, gen: 'Bossa', hue: 140},
  {id: 's22', t: 'Solea', ar: 'Miles Davis', al: 'Sketches of Spain', y: 1960, d: 738, br: 1411, gen: 'Jazz', hue: 18},
  {id: 's23', t: 'Mood Indigo', ar: 'Duke Ellington', al: 'Solos, Duets, and Trios', y: 1930, d: 215, br: 1411, gen: 'Jazz', hue: 225},
  {id: 's24', t: 'Misty', ar: 'Erroll Garner', al: 'Contrasts', y: 1954, d: 198, br: 1411, gen: 'Jazz', hue: 195},
  {id: 's25', t: 'Body and Soul', ar: 'Coleman Hawkins', al: 'Body and Soul', y: 1939, d: 181, br: 1411, gen: 'Jazz', hue: 348},
  {id: 's26', t: 'Cello Suite No. 1 - Prelude', ar: 'J.S. Bach', al: 'Cello Suites', y: 1717, d: 156, br: 1411, gen: 'Classical', hue: 38},
  {id: 's27', t: 'Nocturne Op. 9 No. 2', ar: 'Frédéric Chopin', al: 'Nocturnes', y: 1832, d: 257, br: 1411, gen: 'Classical', hue: 30},
  {id: 's28', t: 'Hallelujah Junction, I', ar: 'John Adams', al: 'Hallelujah Junction', y: 1996, d: 264, br: 1411, gen: 'Modern', hue: 220},
  {id: 's29', t: 'Goldberg Variations - Aria', ar: 'Glenn Gould', al: 'Goldberg Variations (1981)', y: 1981, d: 213, br: 1411, gen: 'Classical', hue: 36},
  {id: 's30', t: 'River Man', ar: 'Nick Drake', al: 'Five Leaves Left', y: 1969, d: 256, br: 1411, gen: 'Folk', hue: 18},
  {id: 's31', t: 'These Days', ar: 'Jackson Browne', al: 'For Everyman', y: 1973, d: 269, br: 1411, gen: 'Folk', hue: 28},
  {id: 's32', t: 'Pancho and Lefty', ar: 'Townes Van Zandt', al: 'The Late Great', y: 1972, d: 234, br: 1411, gen: 'Folk', hue: 22},
  {id: 's33', t: 'If I Were a Carpenter', ar: 'Tim Hardin', al: 'Tim Hardin 2', y: 1967, d: 145, br: 1411, gen: 'Folk', hue: 14},
  {id: 's34', t: 'Both Sides Now', ar: 'Joni Mitchell', al: 'Clouds', y: 1969, d: 256, br: 1411, gen: 'Folk', hue: 32},
  {id: 's35', t: 'Pavane pour une infante défunte', ar: 'Maurice Ravel', al: 'Solo Piano Works', y: 1899, d: 369, br: 1411, gen: 'Classical', hue: 8},
  {id: 's36', t: 'Sketch 1 for Solo Piano', ar: 'Nils Frahm', al: 'Spaces', y: 2013, d: 261, br: 1411, gen: 'Modern', hue: 200},
  {id: 's37', t: 'Avril 14th', ar: 'Aphex Twin', al: 'Drukqs', y: 2001, d: 124, br: 1411, gen: 'Electronic', hue: 280},
  {id: 's38', t: "Une Barque sur l'Océan", ar: 'Maurice Ravel', al: 'Miroirs', y: 1906, d: 472, br: 1411, gen: 'Classical', hue: 215},
  {id: 's39', t: 'Lágrima', ar: 'Francisco Tárrega', al: 'Guitar Works', y: 1881, d: 132, br: 1411, gen: 'Classical', hue: 16},
  {id: 's40', t: 'Sketches from a Dead City', ar: 'Hauschka', al: 'Salon des Amateurs', y: 2011, d: 312, br: 1411, gen: 'Modern', hue: 250},
];

export const PLAYLISTS: Playlist[] = [
  {id: 'pl1', name: 'Late Night Listening', note: 'for the quiet hours', songIds: ['s1', 's11', 's24', 's23', 's5', 's13', 's27', 's36']},
  {id: 'pl2', name: 'Sunday Coffee', note: 'slow start to the day', songIds: ['s4', 's7', 's30', 's31', 's34', 's20', 's29', 's39']},
  {id: 'pl3', name: 'Rainy Afternoon', note: 'for the window seat', songIds: ['s13', 's37', 's38', 's35', 's40', 's36', 's5']},
  {id: 'pl4', name: 'First Take', note: 'the recordings that started it all', songIds: ['s17', 's19', 's25', 's23', 's14', 's18']},
  {id: 'pl5', name: 'Café del Sur', note: 'with a sliver of orange peel', songIds: ['s8', 's20', 's21', 's14', 's39']},
];

export const GENRES = [
  {label: 'Jazz', hue: 28},
  {label: 'Classical', hue: 200},
  {label: 'Folk', hue: 22},
  {label: 'Modern', hue: 250},
  {label: 'Bossa', hue: 130},
  {label: 'Vocal', hue: 350},
  {label: 'Tango', hue: 18},
  {label: 'Electronic', hue: 280},
];

export function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getSongById(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}
