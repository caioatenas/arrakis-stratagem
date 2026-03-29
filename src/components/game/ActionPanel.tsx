import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import type { Territory, PlayerEstado } from '@/hooks/useGameState';
import type { MovementFlow } from '@/hooks/useMovementFlow';
import { ACTION_LABELS } from '@/lib/gameConstants';
import { CombatPreview } from './CombatPreview';
import { Swords, Shield, Eye, Move, Gem, ArrowRight, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ActionType = 'mover' | 'atacar' | 'fortificar' | 'espionar' | 'extrair';

interface ActionPanelProps {
  selectedTerritory: string | null;
  territories: Territory[];
  playerEstado: PlayerEstado | null;
  playerId: string | null;
  partidaId: string | null;
  turnoId: string | null;
  onAction: () => void;
  movementFlow: MovementFlow;
  onStartMove: () => void;
  onStartAttack: () => void;
  onSetQuantity: (q: number) => void;
  onConfirmQuantity: () => void;
  onSelectDestination: (id: string) => void;
  onConfirmMove: () => void;
  onCancelMove: () => void;
}

const ACTION_ICONS: Record<ActionType, React.ReactNode> = {
  mover: <Move className="w-4 h-4" />,
  atacar: <Swords className="w-4 h-4" />,
  fortificar: <Shield className="w-4 h-4" />,
  espionar: <Eye className="w-4 h-4" />,
  extrair: <Gem className="w-4 h-4" />,
};

export function ActionPanel({
  selectedTerritory, territories, playerEstado, playerId, partidaId, turnoId, onAction,
  movementFlow, onStartMove, onStartAttack, onSetQuantity, onConfirmQuantity, onSelectDestination, onConfirmMove, onCancelMove,
}: ActionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [targetTerritory, setTargetTerritory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentTerr = territories.find(t => t.id === selectedTerritory);
  const isOwnTerritory = currentTerr?.dono_id === playerId;
  const neighbors = currentTerr ? territories.filter(t => currentTerr.vizinhos.includes(t.id)) : [];
  const acoes = playerEstado?.acoes_restantes ?? 0;
  const isInMoveFlow = movementFlow.state !== 'idle';

  // === MOVEMENT / ATTACK FLOW UI ===
  if (isInMoveFlow) {
    const originTerr = territories.find(t => t.id === movementFlow.originId);
    const destTerr = movementFlow.destinationId ? territories.find(t => t.id === movementFlow.destinationId) : null;
    const remaining = (originTerr?.forca ?? 0) - movementFlow.quantity;
    const isAttack = movementFlow.actionType === 'atacar';
    const flowTitle = isAttack ? 'Atacar Território' : 'Mover Tropas';

    return (
      <div className="border-glow rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-display text-primary text-lg">{flowTitle}</h3>
          <Button variant="ghost" size="icon" onClick={onCancelMove} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 text-xs font-body">
          {['Origem', 'Quantidade', 'Destino', isAttack ? 'Previsão' : 'Confirmar'].map((label, i) => {
            const stepStates: MovementFlow['state'][] = ['origin_selected', 'action_selected', 'quantity_selected', isAttack ? 'attack_preview' : 'confirming'];
            const currentIdx = stepStates.indexOf(movementFlow.state);
            const isActive = i <= (currentIdx >= 0 ? currentIdx : 0);
            return (
              <div key={label} className="flex items-center gap-1">
                {i > 0 && <div className={`w-4 h-px ${isActive ? 'bg-primary' : 'bg-border'}`} />}
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-primary/20 text-primary' : 'bg-secondary/50 text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Origin info */}
        <div className="bg-secondary/30 rounded p-2 text-sm font-body space-y-0.5">
          <p className="text-muted-foreground">Origem: <span className="text-foreground font-semibold">{originTerr?.nome}</span></p>
          <p className="text-muted-foreground">Força atual: <span className="text-primary font-bold">{originTerr?.forca}</span></p>
        </div>

        {/* Step 2: Quantity selection */}
        {(movementFlow.state === 'action_selected' || movementFlow.state === 'origin_selected') && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <p className="text-xs text-muted-foreground font-body">
              {isAttack ? 'Selecione quantas tropas enviar ao ataque:' : 'Selecione quantas tropas mover:'}
            </p>

            {/* Quick buttons */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: '25%', value: Math.max(1, Math.floor(movementFlow.maxQuantity * 0.25)) },
                { label: '50%', value: Math.max(1, Math.floor(movementFlow.maxQuantity * 0.5)) },
                { label: '75%', value: Math.max(1, Math.floor(movementFlow.maxQuantity * 0.75)) },
                { label: 'MAX', value: movementFlow.maxQuantity },
              ].map(btn => (
                <button key={btn.label}
                  onClick={() => onSetQuantity(btn.value)}
                  className={`py-1.5 rounded text-xs font-body transition-all border
                    ${movementFlow.quantity === btn.value
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-secondary/50 border-border text-secondary-foreground hover:bg-secondary'
                    }`}>
                  {btn.label}
                </button>
              ))}
            </div>

            <Slider
              min={1} max={movementFlow.maxQuantity} step={1}
              value={[movementFlow.quantity]}
              onValueChange={([v]) => onSetQuantity(v)}
            />

            <div className="bg-secondary/20 rounded p-2 text-xs font-body space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isAttack ? 'Enviando:' : 'Movendo:'}</span>
                <span className="text-primary font-bold text-sm">{movementFlow.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Restante em {originTerr?.nome}:</span>
                <span className={`font-bold ${remaining <= 2 ? 'text-destructive' : 'text-foreground'}`}>{remaining}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disponível:</span>
                <span className="text-muted-foreground">{movementFlow.maxQuantity} máx</span>
              </div>
            </div>

            <Button onClick={onConfirmQuantity} className="w-full font-display tracking-wider" size="sm">
              Selecionar Destino <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* Step 3: Destination selection */}
        {movementFlow.state === 'quantity_selected' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <p className="text-xs text-muted-foreground font-body">
              {isAttack
                ? 'Clique em um território inimigo vizinho para atacar:'
                : 'Clique em um território vizinho no mapa ou selecione abaixo:'}
            </p>
            <div className="flex flex-wrap gap-1">
              {neighbors
                .filter(n => isAttack
                  ? (n.dono_id && n.dono_id !== playerId) // Attack: enemy only
                  : (!n.dono_id || n.dono_id === playerId) // Move: own or neutral
                )
                .map(n => (
                  <button key={n.id} onClick={() => onSelectDestination(n.id)}
                    className={`px-3 py-1.5 rounded text-xs font-body transition-all border
                      ${isAttack
                        ? 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 hover:border-destructive'
                        : 'bg-secondary/50 border-border text-secondary-foreground hover:bg-primary/20 hover:border-primary hover:text-primary'
                      }`}>
                    {n.nome} {isAttack && `(${n.forca})`}
                  </button>
                ))}
            </div>
            {isAttack && neighbors.filter(n => n.dono_id && n.dono_id !== playerId).length === 0 && (
              <p className="text-xs text-destructive font-body">Nenhum território inimigo vizinho.</p>
            )}
            {!isAttack && neighbors.filter(n => !n.dono_id || n.dono_id === playerId).length === 0 && (
              <p className="text-xs text-destructive font-body">Nenhum destino válido.</p>
            )}
          </motion.div>
        )}

        {/* Step 4a: Attack Preview */}
        {movementFlow.state === 'attack_preview' && originTerr && destTerr && (
          <CombatPreview
            origin={originTerr}
            target={destTerr}
            attackerTroops={movementFlow.quantity}
            onConfirm={onConfirmMove}
            onCancel={onCancelMove}
          />
        )}

        {/* Step 4b: Move Confirmation */}
        {movementFlow.state === 'confirming' && destTerr && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm font-body">
              <p className="text-primary font-display tracking-wide text-center mb-2">Confirmar Movimento</p>
              <div className="flex items-center justify-center gap-2 text-foreground">
                <span className="font-semibold">{originTerr?.nome}</span>
                <ArrowRight className="w-4 h-4 text-primary" />
                <span className="font-semibold">{destTerr.nome}</span>
              </div>
              <p className="text-center text-primary font-bold text-lg mt-1">{movementFlow.quantity} tropas</p>
              <div className="mt-2 pt-2 border-t border-border/50 space-y-0.5 text-xs text-muted-foreground">
                <p>{originTerr?.nome} ficará com: <span className="text-foreground font-semibold">{remaining}</span></p>
                <p>{destTerr.nome} ficará com: <span className="text-foreground font-semibold">{(destTerr.forca || 0) + movementFlow.quantity}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onCancelMove} size="sm" className="font-body">
                Cancelar
              </Button>
              <Button onClick={onConfirmMove} size="sm" className="font-display tracking-wider">
                <Check className="w-3.5 h-3.5 mr-1" /> Confirmar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Animating state */}
        {movementFlow.state === 'animating' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.2 }}
              className="text-primary font-display tracking-widest text-sm">
              {isAttack ? 'ATACANDO...' : 'MOVENDO TROPAS...'}
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }

  // === NORMAL ACTION PANEL (non-movement) ===
  const canSubmitNonMove = () => {
    if (!selectedAction || !partidaId || !turnoId || !playerId || acoes <= 0) return false;
    if (['fortificar', 'espionar', 'extrair'].includes(selectedAction) && !selectedTerritory) return false;
    return true;
  };

  const handleSubmitNonMove = async () => {
    if (!canSubmitNonMove() || submitting) return;
    setSubmitting(true);

    const acao = {
      turno_id: turnoId!,
      player_id: playerId!,
      partida_id: partidaId!,
      tipo: selectedAction! as ActionType,
      origem_id: selectedTerritory,
      destino_id: selectedTerritory,
      quantidade: 0,
    };

    await supabase.from('acoes').insert(acao);
    if (playerEstado) {
      await supabase.from('player_estado').update({ acoes_restantes: Math.max(0, acoes - 1) }).eq('id', playerEstado.id);
    }

    setSelectedAction(null);
    setTargetTerritory(null);
    setSubmitting(false);
    onAction();
  };

  return (
    <div className="border-glow rounded-lg p-4 space-y-4" data-tutorial="actions">
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
          <div className="text-sm text-foreground/80 font-body mb-2">
            {currentTerr?.nome} — Força: {currentTerr?.forca} | Defesa: {currentTerr?.defesa_base}
          </div>

          <div className="grid grid-cols-5 gap-1">
            {(Object.keys(ACTION_LABELS) as ActionType[]).map(action => {
              if (action === 'mover') {
                const disabled = acoes <= 0 || !isOwnTerritory || (currentTerr?.forca ?? 0) < 2;
                return (
                  <button key={action} onClick={onStartMove} disabled={disabled}
                    className="flex flex-col items-center gap-1 p-2 rounded text-xs transition-all bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed">
                    {ACTION_ICONS[action]}
                    <span className="font-body">Mover</span>
                  </button>
                );
              }

              if (action === 'atacar') {
                const disabled = acoes <= 0 || !isOwnTerritory || (currentTerr?.forca ?? 0) < 2;
                return (
                  <button key={action} onClick={onStartAttack} disabled={disabled}
                    className="flex flex-col items-center gap-1 p-2 rounded text-xs transition-all bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 disabled:opacity-30 disabled:cursor-not-allowed">
                    {ACTION_ICONS[action]}
                    <span className="font-body">Atacar</span>
                  </button>
                );
              }

              const disabled = acoes <= 0 || !isOwnTerritory;

              return (
                <button key={action}
                  onClick={() => { setSelectedAction(action); setTargetTerritory(null); }}
                  disabled={disabled}
                  className={`flex flex-col items-center gap-1 p-2 rounded text-xs transition-all
                    ${selectedAction === action
                      ? 'bg-primary/20 border border-primary text-primary'
                      : 'bg-secondary/50 border border-border text-secondary-foreground hover:bg-secondary'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}>
                  {ACTION_ICONS[action]}
                  <span className="font-body">{action.charAt(0).toUpperCase() + action.slice(1)}</span>
                </button>
              );
            })}
          </div>

          <Button onClick={handleSubmitNonMove} disabled={!canSubmitNonMove() || submitting}
            className="w-full font-display tracking-wider">
            {submitting ? 'Enviando...' : 'Executar Ação'}
          </Button>
        </>
      )}
    </div>
  );
}
