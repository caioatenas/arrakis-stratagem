// Map data - fixed initial map
export interface TerritoryDef {
  id: string;
  nome: string;
  vizinhos: string[];
  producao_spice: number;
  defesa_base: number;
  pos_x: number;
  pos_y: number;
}

export const TERRITORIES: TerritoryDef[] = [
  { id: 't1', nome: 'Arrakeen', vizinhos: ['t2'], producao_spice: 15, defesa_base: 5, pos_x: 400, pos_y: 120 },
  { id: 't2', nome: 'Bacia Norte', vizinhos: ['t1', 't3', 't4'], producao_spice: 10, defesa_base: 3, pos_x: 250, pos_y: 250 },
  { id: 't3', nome: 'Deserto Profundo', vizinhos: ['t2', 't5'], producao_spice: 20, defesa_base: 2, pos_x: 550, pos_y: 280 },
  { id: 't4', nome: 'Sietch Tabr', vizinhos: ['t2', 't5'], producao_spice: 12, defesa_base: 8, pos_x: 180, pos_y: 420 },
  { id: 't5', nome: 'Caverna Sul', vizinhos: ['t3', 't4'], producao_spice: 8, defesa_base: 10, pos_x: 520, pos_y: 440 },
];

export const PLAYER_COLORS = ['#C4A35A', '#4A90D9', '#D94A4A', '#4AD97A'];

export const ACTION_LABELS: Record<string, string> = {
  mover: 'Mover Tropas',
  atacar: 'Atacar',
  fortificar: 'Fortificar',
  espionar: 'Espionar',
  extrair: 'Extrair Spice',
};
