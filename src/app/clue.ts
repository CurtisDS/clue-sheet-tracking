export interface Suspect {
  id: string;
  name: string,
  shortname: string;
  color: PlayerColor
}

export interface Theme {
  id: string;
  title: string;
  order: number;
  suspects: Suspect[];
  weapons: string[];
  rooms: string[];
}

export interface PlayerColor {
  value: string
}

export const SuspectColors: { [key: string]: PlayerColor } = {
  adler: {
    value: '#37958f'
  },
  azure: {
    value: '#2f4890'
  },
  brunette: {
    value: '#563d2b'
  },
  gray: {
    value: '#5a5a5a'
  },
  green: {
    value: '#377815'
  },
  meadow: {
    value: '#55a2af'
  },
  moriarty: {
    value: '#363635'
  },
  mustard: {
    value: '#e2a428'
  },
  orchid: {
    value: '#c72486'
  },  
  peach: {
    value: '#dc8876'
  },
  peacock: {
    value: '#2060c5'
  },
  plum: {
    value: '#a323c1'
  },
  rose: {
    value: '#ba465e'
  },
  rusty: {
    value: '#e35f00'
  },
  scarlett: {
    value: '#e7153c'
  },
  sherlock: {
    value: '#bb9e6a'
  },
  watson: {
    value: '#4e5e04'
  },
  white: {
    value: '#000000'
  }
};

export function compareSuspectFn(s1: Suspect, s2: Suspect): boolean {
  return s1 && s2 ? s1.id === s2.id : s1 === s2;
}

export function compareThemeFn(t1: Theme, t2: Theme): boolean {
  return t1 && t2 ? t1.id === t2.id : t1 === t2;
}

export function getTheme(id: string): Theme {
  return ClueThemes.find(v => v.id == id ?? "classic");
}

export const ClueThemes: Theme[] = [
  {
    id: 'tudor',
    title: 'Tudor Mansion',
    order: 1,
    suspects: [
      { id: 'tudor-scarlett', name: 'Miss Scarlett', shortname: 'Scarlett', color: SuspectColors.scarlett },
      { id: 'tudor-plum', name: 'Professor Plum', shortname: 'Plum', color: SuspectColors.plum },
      { id: 'tudor-peacock', name: 'Mrs. Peacock', shortname: 'Peacock', color: SuspectColors.peacock },
      { id: 'tudor-mustard', name: 'Colonel Mustard', shortname: 'Mustard', color: SuspectColors.mustard },
      { id: 'tudor-green', name: 'Mr. Green', shortname: 'Green', color: SuspectColors.green },
      { id: 'tudor-orchid', name: 'Dr. Orchid', shortname: 'Orchid', color: SuspectColors.orchid }
    ],
    weapons: [
      'Candlestick',
      'Dagger',
      'Lead Pipe',
      'Revolver',
      'Rope',
      'Wrench'
    ],
    rooms: [
      'Ballroom',
      'Billiard Room',
      'Conservatory',
      'Dining Room',
      'Hall',
      'Kitchen',
      'Library',
      'Lounge',
      'Study'
    ]
  },
  {
    id: 'classic',
    title: 'Classic',
    order: 2,
    suspects: [
      { id: 'classic-scarlett', name: 'Miss Scarlett', shortname: 'Scarlett', color: SuspectColors.scarlett },
      { id: 'classic-plum', name: 'Professor Plum', shortname: 'Plum', color: SuspectColors.plum },
      { id: 'classic-peacock', name: 'Mrs. Peacock', shortname: 'Peacock', color: SuspectColors.peacock },
      { id: 'classic-mustard', name: 'Colonel Mustard', shortname: 'Mustard', color: SuspectColors.mustard },
      { id: 'classic-green', name: 'Mr. Green', shortname: 'Green', color: SuspectColors.green },
      { id: 'classic-white', name: 'Mrs. White', shortname: 'White', color: SuspectColors.white }
    ],
    weapons: [
      'Candlestick',
      'Dagger',
      'Lead Pipe',
      'Revolver',
      'Rope',
      'Wrench'
    ],
    rooms: [
      'Ballroom',
      'Billiard Room',
      'Conservatory',
      'Dining Room',
      'Hall',
      'Kitchen',
      'Library',
      'Lounge',
      'Study'
    ]
  },
  {
    id: 'hollywood',
    title: 'Hollywood Studio',
    order: 3,
    suspects: [
      { id: 'hollywood-scarlett', name: 'Scarlett', shortname: 'Scarlett', color: SuspectColors.scarlett },
      { id: 'hollywood-plum', name: 'Plum', shortname: 'Plum', color: SuspectColors.plum },
      { id: 'hollywood-peacock', name: 'Peacock', shortname: 'Peacock', color: SuspectColors.peacock },
      { id: 'hollywood-mustard', name: 'Mustard', shortname: 'Mustard', color: SuspectColors.mustard },
      { id: 'hollywood-green', name: 'Green', shortname: 'Green', color: SuspectColors.green },
      { id: 'hollywood-orchid', name: 'Orchid', shortname: 'Orchid', color: SuspectColors.orchid }
    ],
    weapons: [
      'Award',
      'Dagger',
      'Lead Pipe',
      'Pistol',
      'Velvet Rope',
      'Wrench'
    ],
    rooms: [
      'Roman Set',
      'Sci Fi Set',
      'Director\'s Office',
      'Cinema',
      'Hall',
      'Dressing Room',
      'Western Set',
      'Editing Room',
      'Prop Room'
    ]
  },
  {
    id: 'express',
    title: 'Murder Express',
    order: 4,
    suspects: [
      { id: 'express-scarlett', name: 'Lady Scarlett', shortname: 'Scarlett', color: SuspectColors.scarlett },
      { id: 'express-plum', name: 'Lord Plum', shortname: 'Plum', color: SuspectColors.plum },
      { id: 'express-peacock', name: 'Peacock', shortname: 'Peacock', color: SuspectColors.peacock },
      { id: 'express-mustard', name: 'Mustard', shortname: 'Mustard', color: SuspectColors.mustard },
      { id: 'express-green', name: 'Green', shortname: 'Green', color: SuspectColors.green },
      { id: 'express-orchid', name: 'Duchess Orchid', shortname: 'Orchid', color: SuspectColors.orchid },
      { id: 'express-white', name: 'Dr. White', shortname: 'White', color: SuspectColors.white },
      { id: 'express-peach', name: 'Peach', shortname: 'Peach', color: SuspectColors.peach },
      { id: 'express-brunette', name: 'Maharaja Brunette', shortname: 'Brunette', color: SuspectColors.brunette }
    ],
    weapons: [
      'Lamp',
      'Knife',
      'Coal Shovel',
      'Glass',
      'Velvet Rope',
      'Wrench'
    ],
    rooms: [
      'Signal Box',
      'Lounge Car',
      'Sleeper Car',
      'Taxi Stand',
      'Concourse',
      'Station Bar',
      'Dining Car',
      'Barber Shop',
      'Engine'
    ]
  }
];