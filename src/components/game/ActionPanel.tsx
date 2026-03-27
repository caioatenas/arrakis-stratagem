import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Territory, PlayerEstado } from '@/hooks/useGameState';
import { ACTION_LABELS } from '@/lib/gameConstants';
import { Swords, Shield, Eye, Move, Gem } from 'lucide-react';

type ActionType = 'mover' | 'atacar' | 'fortificar' | 'espionar' | 'extrair';

interface ActionPanelProps {
  selectedTerritory: string | null;
  territories: Territory[];
  playerEstado: PlayerEstado | null;
  playerId: string | null;
  partidaId: string | null;
  turnoId: string | null;
  onAction: () => void;
}

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  mover: <Move className="w-4 h-4" />,
  atacar: <Swords className="w-4 h-4" />,
  fortificar: <Shield className="w-4 h-4" />,
  espionar: <Eye className="w-4 h-4" />,
  extrair: <Gem className="w-4 h-4" />,
};

export function ActionPanel({ selectedTerritory, territories, playerEstado, playerId, partidaId, turnoId, onAction }: ActionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [targetTerritory, setTargetTerritory] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const currentTerr = territories.find(t => t.id === selectedTerritory);
  const isOwnTerritory = currentTerr?.dono_id === playerId;
  const neighbors = currentTerr ? territories.filter(t => currentTerr.vizinhos.includes(t.id)) : [];
  const acoes = playerEstado?.acoes_restantes ?? 0;

  const canSubmit = () => {
    if (!selectedAction || !partidaId || !turnoId || !playerId || acoes <= 0) return false;
    if (['mover', 'atacar'].includes(selectedAction) && !targetTerritory) return false;
    if (selectedAction === 'mover' && (!quantity || quantity <= 0)) return false;
    if (['fortificar', 'espionar', 'extrair'].includes(selectedAction) && !selectedTerritory) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || submitting) return;
    setSubmitting(true);

    const acao = {
      turno_id: turnoId!,
      player_id: playerId!,
      partida_id: partidaId!,
      tipo: selectedAction! as ActionType,
      origem_id: selectedTerritory,
      destino_id: ['mover', 'atacar', 'espionar'].includes(selectedAction!) ? targetTerritory : selectedTerritory,
      quantidade: selectedAction === 'mover' ? quantity : 0,
    };

    await supabase.from('acoes').insert(acao);
    
    // Decrement actions remaining
    if (playerEstado) {
      await supabase
        .from('player_estado')
        .update({ acoes_restantes: Math.max(0, acoes - 1) })
        .eq('id', playerEstado.id);
    }

    setSelectedAction(null);
    setTargetTerritory(null);
    setQuantity(10);
    setSubmitting(false);
    onAction();
  };

  return (
    <div className="border-glow rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-display text-primary text-lg">Ações</h3>
        <span className="text-sm text-muted-foreground font-body">
          Restantes: <span className="text-primary font-bold">{acoes}</span>
        </span>
      </div>

      {!selectedTerritory && (
        <p className="text-muted-foreground text-sm">Selecione um território no mapa</p>
      )}

      {selectedTerritory && (
        <>
          <div className="text-sm text-sand-light font-body mb-2">
            {currentTerr?.nome} — Força: {currentTerr?.forca} | Defesa: {currentTerr?.defesa_base}
          </div>

          <div className="grid grid-cols-5 gap-1">
            {(Object.keys(ACTION_LABELS) as ActionType[]).map(action => {
              const disabled = acoes <= 0 ||
                (['mover', 'atacar'].includes(action) && !isOwnTerritory) ||
                (['fortificar', 'extrair'].includes(action) && !isOwnTerritory);

              return (
                <button
                  key={action}
                  onClick={() => { setSelectedAction(action); setTargetTerritory(null); }}
                  disabled={disabled}
                  className={`flex flex-col items-center gap-1 p-2 rounded text-xs transition-all
                    ${selectedAction === action
                      ? 'bg-primary/20 border border-primary text-primary'
                      : 'bg-secondary/50 border border-border text-secondary-foreground hover:bg-secondary'
                    }
                    disabled:opacity-30 disabled:cursor-not-allowed
                  `}
                >
                  {ACTION_ICONS[action]}
                  <span className="font-body">{action.charAt(0).toUpperCase() + action.slice(1)}</span>
                </button>
              );
            })}
          </div>

          {/* Target selection for movement/attack */}
          {selectedAction && ['mover', 'atacar', 'espionar'].includes(selectedAction) && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Selecione destino:</p>
              <div className="flex flex-wrap gap-1">
                {neighbors.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setTargetTerritory(n.id)}
                    className={`px-3 py-1 rounded text-xs font-body transition-all
                      ${targetTerritory === n.id
                        ? 'bg-accent/30 border border-accent text-accent-foreground'
                        : 'bg-secondary/50 border border-border text-secondary-foreground hover:bg-secondary'
                      }
                    `}
                  >
                    {n.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity for movement */}
          {selectedAction === 'mover' && targetTerritory && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quantidade: {quantity}</p>
              <input
                type="range"
                min={1}
                max={currentTerr?.forca || 1}
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || submitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-display tracking-wider"
          >
            {submitting ? 'Enviando...' : 'Executar Ação'}
          </Button>
        </>
      )}
    </div>
  );
}
