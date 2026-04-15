import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Swords, MapPin, Gem, Crown, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Territory } from '@/hooks/useGameState';
import type { PlayerEstado } from '@/hooks/useGameState';
import { FACTIONS } from '@/lib/factions';

interface Props {
  territories: Territory[];
  playerEstados: PlayerEstado[];
  currentPlayerId: string | null;
  vencedorId?: string | null;
}

interface PlayerStats {
  playerId: string;
  house: string | null;
  cor: string;
  territoryCount: number;
  totalForce: number;
  spice: number;
  isWinner: boolean;
}

export function GameOverScreen({ territories, playerEstados, currentPlayerId, vencedorId }: Props) {
  const navigate = useNavigate();

  const stats: PlayerStats[] = playerEstados
    .map(pe => {
      const owned = territories.filter(t => t.dono_id === pe.player_id);
      return {
        playerId: pe.player_id,
        house: pe.house,
        cor: pe.cor,
        territoryCount: owned.length,
        totalForce: owned.reduce((s, t) => s + t.forca, 0),
        spice: pe.spice,
        isWinner: pe.player_id === vencedorId,
      };
    })
    .sort((a, b) => {
      if (a.isWinner) return -1;
      if (b.isWinner) return 1;
      return b.territoryCount - a.territoryCount || b.spice - a.spice;
    });

  const getFaction = (house: string | null) =>
    FACTIONS.find(f => f.id === house);

  const isMe = (playerId: string) => playerId === currentPlayerId;
  const myStats = stats.find(s => s.playerId === currentPlayerId);
  const iWon = myStats?.isWinner ?? false;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl space-y-6 relative z-10"
      >
        {/* Title */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            {iWon ? (
              <Crown className="w-16 h-16 mx-auto text-primary drop-shadow-lg" />
            ) : (
              <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
            )}
          </motion.div>
          <h1 className="text-display text-4xl md:text-5xl text-primary tracking-[0.2em]">
            {iWon ? 'VITÓRIA' : 'PARTIDA ENCERRADA'}
          </h1>
          <p className="text-muted-foreground font-body text-lg">
            {iWon ? 'Você dominou Arrakis!' : 'A guerra terminou.'}
          </p>
        </div>

        {/* Ranking */}
        <Card className="border-primary/20 bg-card/80 backdrop-blur">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-display text-sm tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4" /> RANKING FINAL
            </h2>
            {stats.map((s, idx) => {
              const faction = getFaction(s.house);
              const rank = idx + 1;
              return (
                <motion.div
                  key={s.playerId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    s.isWinner
                      ? 'border-primary/40 bg-primary/10'
                      : isMe(s.playerId)
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-border/50 bg-transparent'
                  }`}
                >
                  {/* Rank badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      rank === 1
                        ? 'bg-primary text-primary-foreground'
                        : rank === 2
                        ? 'bg-muted text-foreground'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {rank}
                  </div>

                  {/* Faction color dot + name */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                      style={{ backgroundColor: s.cor }}
                    />
                    <span className="font-body text-sm truncate text-foreground">
                      {faction ? `${faction.symbol} ${faction.name}` : 'Sem Casa'}
                      {isMe(s.playerId) && (
                        <span className="text-xs text-muted-foreground ml-1">(você)</span>
                      )}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1" title="Territórios">
                      <MapPin className="w-3 h-3" /> {s.territoryCount}
                    </span>
                    <span className="flex items-center gap-1" title="Força total">
                      <Swords className="w-3 h-3" /> {s.totalForce}
                    </span>
                    <span className="flex items-center gap-1" title="Spice">
                      <Gem className="w-3 h-3" /> {s.spice}
                    </span>
                  </div>

                  {s.isWinner && (
                    <Trophy className="w-4 h-4 text-primary shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* My summary card */}
        {myStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-border/50 bg-card/60 backdrop-blur">
              <CardContent className="p-4">
                <h2 className="text-display text-sm tracking-widest text-muted-foreground mb-3">
                  SUAS ESTATÍSTICAS
                </h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{myStats.territoryCount}</div>
                    <div className="text-xs text-muted-foreground">Territórios</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{myStats.totalForce}</div>
                    <div className="text-xs text-muted-foreground">Força Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{myStats.spice}</div>
                    <div className="text-xs text-muted-foreground">Spice</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center"
        >
          <Button
            size="lg"
            onClick={() => navigate('/lobby')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Lobby
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
