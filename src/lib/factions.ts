// Faction / House system for visual identity
export interface Faction {
  id: string;
  name: string;
  color: string;
  colorHsl: string;
  symbol: string;
  bannerGradient: [string, string];
  description: string;
  bonus: string;
}

export const FACTIONS: Faction[] = [
  {
    id: 'atreides',
    name: 'House Atreides',
    color: '#4A90D9',
    colorHsl: 'hsl(213, 62%, 57%)',
    symbol: '🦅',
    bannerGradient: ['#4A90D9', '#2C5F8A'],
    description: 'Honra, liderança, equilíbrio',
    bonus: '+10% defesa',
  },
  {
    id: 'harkonnen',
    name: 'House Harkonnen',
    color: '#D94A4A',
    colorHsl: 'hsl(0, 62%, 57%)',
    symbol: '⚙',
    bannerGradient: ['#D94A4A', '#8A2C2C'],
    description: 'Agressividade, força bruta',
    bonus: '+10% ataque',
  },
  {
    id: 'corrino',
    name: 'House Corrino',
    color: '#C4A35A',
    colorHsl: 'hsl(42, 52%, 56%)',
    symbol: '👑',
    bannerGradient: ['#C4A35A', '#8A7230'],
    description: 'Elite, controle imperial',
    bonus: '+1 ação por turno',
  },
  {
    id: 'fremen',
    name: 'Fremen',
    color: '#D4A574',
    colorHsl: 'hsl(28, 52%, 64%)',
    symbol: '⟁',
    bannerGradient: ['#D4A574', '#8A6A3A'],
    description: 'Domínio do deserto',
    bonus: 'Imunidade parcial a eventos',
  },
  {
    id: 'fenring',
    name: 'House Fenring',
    color: '#8B5CF6',
    colorHsl: 'hsl(258, 90%, 66%)',
    symbol: '🗡',
    bannerGradient: ['#8B5CF6', '#5B21B6'],
    description: 'Furtividade, manipulação',
    bonus: 'Melhor espionagem',
  },
  {
    id: 'ix',
    name: 'House Ix',
    color: '#06B6D4',
    colorHsl: 'hsl(188, 95%, 43%)',
    symbol: '⚛',
    bannerGradient: ['#06B6D4', '#0E7490'],
    description: 'Tecnologia avançada',
    bonus: '+15% produção de spice',
  },
  {
    id: 'bene_gesserit',
    name: 'Bene Gesserit',
    color: '#1F2937',
    colorHsl: 'hsl(215, 28%, 17%)',
    symbol: '◉',
    bannerGradient: ['#374151', '#111827'],
    description: 'Controle mental',
    bonus: 'Visão estratégica extra',
  },
  {
    id: 'guilda',
    name: 'Guilda Espacial',
    color: '#E5E7EB',
    colorHsl: 'hsl(216, 12%, 91%)',
    symbol: '✦',
    bannerGradient: ['#E5E7EB', '#9CA3AF'],
    description: 'Mobilidade suprema',
    bonus: 'Movimento mais eficiente',
  },
  {
    id: 'tleilaxu',
    name: 'Tleilaxu',
    color: '#84CC16',
    colorHsl: 'hsl(84, 81%, 44%)',
    symbol: '☣',
    bannerGradient: ['#84CC16', '#4D7C0F'],
    description: 'Manipulação genética',
    bonus: 'Recuperação de tropas',
  },
];

// Map player color → faction
export function getFactionByColor(color: string): Faction {
  const found = FACTIONS.find(f => f.color === color);
  return found || FACTIONS[2]; // default Corrino
}

export function getFactionById(id: string): Faction | undefined {
  return FACTIONS.find(f => f.id === id);
}

export function getFactionByIndex(index: number): Faction {
  return FACTIONS[index % FACTIONS.length];
}
