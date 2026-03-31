// Map data - fixed initial map
export interface TerritoryDef {
  id: string;
  nome: string;
  vizinhos: string[];
  producao_spice: number;
  defesa_base: number;
  pos_x: number;
  pos_y: number;
  regiao: string;
  tipo: 'comum' | 'estrategico' | 'rico';
}

// ── GAME BALANCE CONSTANTS ──
export const VICTORY_TERRITORY_PCT = 70;
export const VICTORY_SPICE = 800;
export const TROOP_REGEN_PER_TERRITORY = 3;
export const REGION_BONUS_SPICE = 10;
export const COMBAT_DAMAGE_MULTIPLIER = 0.6;
export const SALARY_CYCLE_TURNS = 3;
export const SALARY_TROOP_PERCENT = 0.3;
export const SALARY_COST_PER_TROOP = 1;
export const MAX_SALARY_LOSS_PERCENT = 0.5; // never remove more than 50% of territory force
export const MIN_TERRITORY_FORCE = 1;
export const SUPERPRODUCTION_BONUS = 10;
export const PROGRESSIVE_PRESSURE_START = 10;
export const PROGRESSIVE_PRESSURE_ESCALATE = 15;

// SVG viewBox: 0 0 1100 850
// NORTH = top (y: 60-200), CENTER = middle (y: 280-420), SOUTH = bottom (y: 540-700), EAST = right (y: 300-600)

export const TERRITORIES: TerritoryDef[] = [
  // ── REGIÃO NORTE (defensiva) ──
  { id: 'carthag_ridge',  nome: 'Carthag Ridge',  vizinhos: ['windscar_pass', 'broken_shield'],            producao_spice: 4,  defesa_base: 8,  pos_x: 200, pos_y: 80,  regiao: 'norte', tipo: 'comum' },
  { id: 'windscar_pass',  nome: 'Windscar Pass',  vizinhos: ['carthag_ridge', 'tal_varek', 'shield_basin'], producao_spice: 6,  defesa_base: 6,  pos_x: 380, pos_y: 60,  regiao: 'norte', tipo: 'estrategico' },
  { id: 'broken_shield',  nome: 'Broken Shield',  vizinhos: ['carthag_ridge', 'dust_wall'],                 producao_spice: 4,  defesa_base: 10, pos_x: 120, pos_y: 180, regiao: 'norte', tipo: 'comum' },
  { id: 'tal_varek',      nome: 'Tal Varek',      vizinhos: ['windscar_pass', 'dust_wall'],                 producao_spice: 4,  defesa_base: 7,  pos_x: 340, pos_y: 170, regiao: 'norte', tipo: 'comum' },
  { id: 'dust_wall',      nome: 'Dust Wall',      vizinhos: ['broken_shield', 'tal_varek', 'arrakeen_prime'], producao_spice: 6, defesa_base: 9, pos_x: 220, pos_y: 260, regiao: 'norte', tipo: 'estrategico' },

  // ── REGIÃO CENTRO (conflito) ──
  { id: 'arrakeen_prime', nome: 'Arrakeen Prime', vizinhos: ['dust_wall', 'shield_basin', 'kharos_divide', 'great_flat', 'smugglers_run'], producao_spice: 10, defesa_base: 5, pos_x: 350, pos_y: 340, regiao: 'centro', tipo: 'rico' },
  { id: 'shield_basin',   nome: 'Shield Basin',   vizinhos: ['windscar_pass', 'arrakeen_prime', 'sietch_tabr'],                             producao_spice: 6,  defesa_base: 4, pos_x: 480, pos_y: 280, regiao: 'centro', tipo: 'estrategico' },
  { id: 'kharos_divide',  nome: 'Kharos Divide',  vizinhos: ['arrakeen_prime', 'great_flat', 'silent_corridor'],                            producao_spice: 4,  defesa_base: 3, pos_x: 500, pos_y: 380, regiao: 'centro', tipo: 'comum' },
  { id: 'sietch_tabr',    nome: 'Sietch Tabr',    vizinhos: ['shield_basin', 'great_flat', 'spice_cradle'],                                 producao_spice: 6,  defesa_base: 7, pos_x: 280, pos_y: 430, regiao: 'centro', tipo: 'estrategico' },
  { id: 'great_flat',     nome: 'Great Flat',     vizinhos: ['arrakeen_prime', 'kharos_divide', 'sietch_tabr', 'deep_dunes'],                producao_spice: 4,  defesa_base: 2, pos_x: 380, pos_y: 490, regiao: 'centro', tipo: 'comum' },

  // ── REGIÃO SUL (spice alta) ──
  { id: 'deep_dunes',      nome: 'Deep Dunes',      vizinhos: ['great_flat', 'spice_cradle', 'shai_hulud_nest'],                producao_spice: 10, defesa_base: 2, pos_x: 280, pos_y: 580, regiao: 'sul', tipo: 'rico' },
  { id: 'spice_cradle',    nome: 'Spice Cradle',    vizinhos: ['sietch_tabr', 'deep_dunes', 'red_expanse'],                     producao_spice: 10, defesa_base: 3, pos_x: 160, pos_y: 620, regiao: 'sul', tipo: 'rico' },
  { id: 'shai_hulud_nest', nome: 'Shai-Hulud Nest', vizinhos: ['deep_dunes', 'red_expanse', 'golden_veins'],                    producao_spice: 6,  defesa_base: 1, pos_x: 400, pos_y: 650, regiao: 'sul', tipo: 'estrategico' },
  { id: 'red_expanse',     nome: 'Red Expanse',     vizinhos: ['spice_cradle', 'shai_hulud_nest', 'golden_veins'],               producao_spice: 4,  defesa_base: 2, pos_x: 260, pos_y: 720, regiao: 'sul', tipo: 'comum' },
  { id: 'golden_veins',    nome: 'Golden Veins',    vizinhos: ['shai_hulud_nest', 'red_expanse', 'mirage_fields'],                producao_spice: 10, defesa_base: 2, pos_x: 500, pos_y: 730, regiao: 'sul', tipo: 'rico' },

  // ── REGIÃO LESTE (mobilidade) ──
  { id: 'black_ridge',      nome: 'Black Ridge',      vizinhos: ['smugglers_run', 'silent_corridor'],                   producao_spice: 4,  defesa_base: 6, pos_x: 780, pos_y: 300, regiao: 'leste', tipo: 'comum' },
  { id: 'smugglers_run',    nome: "Smuggler's Run",    vizinhos: ['arrakeen_prime', 'black_ridge', 'outlanders_gate'],   producao_spice: 6,  defesa_base: 3, pos_x: 680, pos_y: 360, regiao: 'leste', tipo: 'estrategico' },
  { id: 'silent_corridor',  nome: 'Silent Corridor',   vizinhos: ['kharos_divide', 'black_ridge', 'mirage_fields'],     producao_spice: 4,  defesa_base: 4, pos_x: 750, pos_y: 440, regiao: 'leste', tipo: 'comum' },
  { id: 'outlanders_gate',  nome: "Outlander's Gate",  vizinhos: ['smugglers_run', 'mirage_fields'],                     producao_spice: 4,  defesa_base: 5, pos_x: 820, pos_y: 500, regiao: 'leste', tipo: 'comum' },
  { id: 'mirage_fields',    nome: 'Mirage Fields',     vizinhos: ['silent_corridor', 'outlanders_gate', 'golden_veins'], producao_spice: 6, defesa_base: 3, pos_x: 700, pos_y: 600, regiao: 'leste', tipo: 'estrategico' },
];

export const REGION_NAMES: Record<string, string> = {
  norte: 'Região Norte',
  centro: 'Região Centro',
  sul: 'Região Sul',
  leste: 'Região Leste',
};

export const REGION_COLORS: Record<string, string> = {
  norte: 'hsl(30, 25%, 40%)',
  centro: 'hsl(35, 40%, 35%)',
  sul: 'hsl(40, 55%, 40%)',
  leste: 'hsl(25, 20%, 38%)',
};

export const PLAYER_COLORS = ['#C4A35A', '#4A90D9', '#D94A4A', '#4AD97A'];

export const ACTION_LABELS: Record<string, string> = {
  mover: 'Mover Tropas',
  atacar: 'Atacar',
  fortificar: 'Fortificar',
  espionar: 'Espionar',
  extrair: 'Extrair Spice',
};
