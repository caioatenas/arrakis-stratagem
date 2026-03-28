// Faction / House system for visual identity
export interface Faction {
  id: string;
  name: string;
  color: string;
  colorHsl: string;
  symbol: string; // SVG path or unicode
  bannerGradient: [string, string];
}

export const FACTIONS: Faction[] = [
  {
    id: 'atreides',
    name: 'House Atreides',
    color: '#4A90D9',
    colorHsl: 'hsl(213, 62%, 57%)',
    symbol: '🦅',
    bannerGradient: ['#4A90D9', '#2C5F8A'],
  },
  {
    id: 'harkonnen',
    name: 'House Harkonnen',
    color: '#D94A4A',
    colorHsl: 'hsl(0, 62%, 57%)',
    symbol: '⚙',
    bannerGradient: ['#D94A4A', '#8A2C2C'],
  },
  {
    id: 'corrino',
    name: 'House Corrino',
    color: '#C4A35A',
    colorHsl: 'hsl(42, 52%, 56%)',
    symbol: '👑',
    bannerGradient: ['#C4A35A', '#8A7230'],
  },
  {
    id: 'fremen',
    name: 'House Fremen',
    color: '#4AD97A',
    colorHsl: 'hsl(145, 62%, 57%)',
    symbol: '⟁',
    bannerGradient: ['#4AD97A', '#2C8A4A'],
  },
];

// Map player color → faction
export function getFactionByColor(color: string): Faction {
  const found = FACTIONS.find(f => f.color === color);
  return found || FACTIONS[2]; // default Corrino
}

export function getFactionByIndex(index: number): Faction {
  return FACTIONS[index % FACTIONS.length];
}
