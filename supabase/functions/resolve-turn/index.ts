import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function d10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function d6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

const REGIONS = ["norte", "centro", "sul", "leste"];
const REGION_BONUS_SPICE = 15;

// House bonus system
const HOUSE_BONUSES: Record<string, { ataque?: number; defesa?: number; acoes?: number; spice_mult?: number; regen?: number }> = {
  atreides:      { defesa: 10 },
  harkonnen:     { ataque: 10 },
  corrino:       { acoes: 1 },
  fremen:        {},           // Handled separately (worm immunity)
  fenring:       {},           // Spy bonus handled in espionage
  ix:            { spice_mult: 15 },
  bene_gesserit: {},
  guilda:        {},           // Movement bonus handled in move
  tleilaxu:      { regen: 3 },
};

function getHouseBonus(playerEstados: any[], playerId: string): typeof HOUSE_BONUSES[string] {
  const pe = playerEstados.find((p: any) => p.player_id === playerId);
  if (!pe?.house) return {};
  return HOUSE_BONUSES[pe.house] || {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { partida_id, turno_id } = await req.json();
    if (!partida_id || !turno_id) {
      return new Response(JSON.stringify({ error: "Missing partida_id or turno_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: territorios }, { data: acoes }, { data: partida }, { data: playerEstados }] = await Promise.all([
      supabase.from("territorios").select("*").eq("partida_id", partida_id),
      supabase.from("acoes").select("*").eq("turno_id", turno_id),
      supabase.from("partidas").select("*").eq("id", partida_id).single(),
      supabase.from("player_estado").select("*").eq("partida_id", partida_id),
    ]);

    if (!territorios || !partida || !playerEstados) {
      return new Response(JSON.stringify({ error: "Game state not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const turnoNum = partida.turno_atual;
    const logs: Array<{ partida_id: string; turno_numero: number; nivel: string; mensagem: string; dados: Record<string, unknown>; player_id?: string }> = [];
    const terrMap = new Map(territorios.map((t: any) => [t.id, { ...t }]));

    // 1. RESOLVE MOVEMENTS
    const moveActions = (acoes || []).filter((a: any) => a.tipo === "mover");
    for (const action of moveActions) {
      const origem = terrMap.get(action.origem_id);
      const destino = terrMap.get(action.destino_id);
      if (!origem || !destino) continue;
      if (origem.dono_id !== action.player_id) continue;
      if (!origem.vizinhos.includes(action.destino_id)) continue;
      if (destino.dono_id && destino.dono_id !== action.player_id) continue;

      const maxMove = Math.floor(origem.forca / 2);
      const qty = Math.min(action.quantidade || 0, maxMove);
      if (qty <= 0) continue;
      if (origem.forca - qty < 1) continue;

      origem.forca -= qty;
      destino.forca += qty;

      logs.push({
        partida_id, turno_numero: turnoNum, nivel: "jogador",
        mensagem: `Moveu ${qty} tropas de ${origem.nome} para ${destino.nome}`,
        dados: { action: "mover", qty }, player_id: action.player_id,
      });
    }

    // 2. RESOLVE ESPIONAGE
    const spyActions = (acoes || []).filter((a: any) => a.tipo === "espionar");
    for (const action of spyActions) {
      const target = terrMap.get(action.destino_id || action.origem_id);
      if (!target) continue;
      logs.push({
        partida_id, turno_numero: turnoNum, nivel: "jogador",
        mensagem: `Espionou ${target.nome}: Força ${target.forca}, Defesa ${target.defesa_base}`,
        dados: { action: "espionar", forca: target.forca, defesa: target.defesa_base },
        player_id: action.player_id,
      });
    }

    // 3. RESOLVE FORTIFY
    const fortifyActions = (acoes || []).filter((a: any) => a.tipo === "fortificar");
    for (const action of fortifyActions) {
      const terr = terrMap.get(action.origem_id || action.destino_id);
      if (!terr || terr.dono_id !== action.player_id) continue;
      terr.defesa_base += 10;
      logs.push({
        partida_id, turno_numero: turnoNum, nivel: "jogador",
        mensagem: `Fortificou ${terr.nome} (+10 defesa)`,
        dados: { action: "fortificar" }, player_id: action.player_id,
      });
    }

    // 4. RESOLVE EXTRACT
    const extractActions = (acoes || []).filter((a: any) => a.tipo === "extrair");
    for (const action of extractActions) {
      const terr = terrMap.get(action.origem_id || action.destino_id);
      if (!terr || terr.dono_id !== action.player_id) continue;
      const pe = playerEstados.find((p: any) => p.player_id === action.player_id);
      if (pe) {
        pe.spice = (pe.spice || 0) + terr.producao_spice;
        logs.push({
          partida_id, turno_numero: turnoNum, nivel: "jogador",
          mensagem: `Extraiu ${terr.producao_spice} Spice de ${terr.nome}`,
          dados: { action: "extrair", spice: terr.producao_spice }, player_id: action.player_id,
        });
      }
    }

    // 5. RESOLVE COMBAT
    const attackActions = (acoes || []).filter((a: any) => a.tipo === "atacar");
    for (const action of attackActions) {
      const origem = terrMap.get(action.origem_id);
      const destino = terrMap.get(action.destino_id);
      if (!origem || !destino) continue;
      if (origem.dono_id !== action.player_id) continue;
      if (!origem.vizinhos.includes(action.destino_id)) continue;

      if (!destino.dono_id || destino.forca <= 0) {
        const sent = Math.floor(origem.forca / 2);
        destino.dono_id = action.player_id;
        destino.forca = sent;
        origem.forca = Math.max(1, origem.forca - sent);
        logs.push({
          partida_id, turno_numero: turnoNum, nivel: "publico",
          mensagem: `${origem.nome} conquistou ${destino.nome} (sem resistência)`,
          dados: { action: "atacar", auto: true },
        });
        continue;
      }

      const atkRoll = d10();
      const defRoll = d10();
      const atkBonus = getHouseBonus(playerEstados, action.player_id);
      const defBonus = destino.dono_id ? getHouseBonus(playerEstados, destino.dono_id) : {};
      const ataque = origem.forca + atkRoll + (atkBonus.ataque || 0);
      const defesa = destino.forca + defRoll + destino.defesa_base + (defBonus.defesa || 0);
      const resultado = ataque - defesa;

      logs.push({
        partida_id, turno_numero: turnoNum, nivel: "publico",
        mensagem: `Combate: ${origem.nome}(${origem.forca}+${atkRoll}) vs ${destino.nome}(${destino.forca}+${defRoll}+${destino.defesa_base}) = ${resultado > 0 ? "VITÓRIA" : resultado < 0 ? "DERROTA" : "EMPATE"}`,
        dados: { atkRoll, defRoll, resultado },
      });

      if (resultado > 0) {
        destino.dono_id = action.player_id;
        destino.forca = Math.max(1, resultado);
        origem.forca = Math.max(1, Math.floor(origem.forca * 0.3));
      } else if (resultado < 0) {
        destino.forca = Math.max(0, destino.forca - Math.abs(resultado));
      } else {
        origem.forca = Math.max(1, origem.forca - 10);
        destino.forca = Math.max(0, destino.forca - 10);
      }
    }

    // 6. SANDWORM EVENT — Dice-based deterministic system
    const wormDie1 = d6();
    const wormDie2 = d6();
    const wormActivated = wormDie1 === wormDie2;
    const wormEventData: Record<string, unknown> = {
      dice: [wormDie1, wormDie2],
      activated: wormActivated,
    };

    const eventos: Array<{ turno_id: string; partida_id: string; tipo: string; descricao: string; territorios_afetados: string[] }> = [];
    const terrArray = Array.from(terrMap.values());

    if (wormActivated) {
      const wormStrength = (wormDie1 + wormDie2) * 10;
      
      // Target selection: weighted by spice production
      const totalWeight = terrArray.reduce((sum: number, t: any) => sum + t.producao_spice, 0);
      let roll = Math.random() * totalWeight;
      let target = terrArray[0];
      for (const t of terrArray) {
        roll -= t.producao_spice;
        if (roll <= 0) { target = t; break; }
      }

      // Fremen immunity: reduce worm damage by 50%
      const ownerBonus = target.dono_id ? getHouseBonus(playerEstados, target.dono_id) : {};
      const isFremen = playerEstados.find((p: any) => p.player_id === target.dono_id)?.house === 'fremen';

      // Worm combat resolution
      const wormAttack = wormStrength + d10();
      const terrDefense = target.forca + target.defesa_base + d10() + (ownerBonus.defesa || 0);
      const wormResult = wormAttack - terrDefense;

      let resultType: string;
      if (wormResult > 0) {
        // Worm wins: territory loses 50% force, 20% defense
        target.forca = Math.max(0, Math.floor(target.forca * 0.5));
        target.defesa_base = Math.max(0, Math.floor(target.defesa_base * 0.8));
        resultType = "attack_wins";
      } else if (wormResult < 0) {
        // Territory defends: loses 20% force
        target.forca = Math.max(0, Math.floor(target.forca * 0.8));
        resultType = "defense_wins";
      } else {
        // Draw: both lose 30%
        target.forca = Math.max(0, Math.floor(target.forca * 0.7));
        target.defesa_base = Math.max(0, Math.floor(target.defesa_base * 0.7));
        resultType = "draw";
      }

      wormEventData.wormStrength = wormStrength;
      wormEventData.targetId = target.id;
      wormEventData.targetName = target.nome;
      wormEventData.result = resultType;
      wormEventData.wormAttack = wormAttack;
      wormEventData.terrDefense = terrDefense;

      eventos.push({
        turno_id, partida_id, tipo: "vermes",
        descricao: `Verme da areia emergiu em ${target.nome} com força ${wormStrength}! Resultado: ${resultType}`,
        territorios_afetados: [target.id],
      });

      logs.push({
        partida_id, turno_numero: turnoNum, nivel: "publico",
        mensagem: `🪱 Verme da areia emergiu em ${target.nome} com força ${wormStrength}! (${wormDie1},${wormDie2}) → ${resultType === "attack_wins" ? "DEVASTAÇÃO" : resultType === "defense_wins" ? "REPELIDO" : "EMPATE"}`,
        dados: wormEventData,
      });
    } else {
      logs.push({
        partida_id, turno_numero: turnoNum, nivel: "publico",
        mensagem: `🪱 Dados do verme: (${wormDie1},${wormDie2}) — Nenhum verme emergiu.`,
        dados: wormEventData,
      });
    }

    // 7. OTHER RANDOM EVENTS (excluding worm which is now deterministic)
    const otherEvents = ["tempestade", "superproducao", "instabilidade"];
    if (Math.random() < 0.35) {
      const eventType = otherEvents[Math.floor(Math.random() * otherEvents.length)];
      switch (eventType) {
        case "tempestade": {
          const affected = terrArray.filter(() => Math.random() < 0.3);
          for (const t of affected) t.forca = Math.max(0, t.forca - 15);
          eventos.push({ turno_id, partida_id, tipo: "tempestade", descricao: `Tempestade de areia! ${affected.length} territórios (-15 força)`, territorios_afetados: affected.map((t: any) => t.id) });
          logs.push({ partida_id, turno_numero: turnoNum, nivel: "publico", mensagem: `🌪️ Tempestade de areia afetou ${affected.length} territórios!`, dados: {} });
          break;
        }
        case "superproducao": {
          for (const pe of playerEstados) pe.spice = (pe.spice || 0) + 20;
          eventos.push({ turno_id, partida_id, tipo: "superproducao", descricao: "Superprodução de Spice! +20 para todos", territorios_afetados: [] });
          logs.push({ partida_id, turno_numero: turnoNum, nivel: "publico", mensagem: `✨ Superprodução de Spice! +20 para todos!`, dados: {} });
          break;
        }
        case "instabilidade": {
          for (const t of terrArray) t.defesa_base = Math.max(0, t.defesa_base - 5);
          eventos.push({ turno_id, partida_id, tipo: "instabilidade", descricao: "Instabilidade política! -5 defesa global", territorios_afetados: terrArray.map((t: any) => t.id) });
          logs.push({ partida_id, turno_numero: turnoNum, nivel: "publico", mensagem: `⚡ Instabilidade política! -5 defesa global`, dados: {} });
          break;
        }
      }
    }

    // 8. REGION BONUS
    for (const region of REGIONS) {
      const regionTerrs = terrArray.filter((t: any) => t.regiao === region);
      if (regionTerrs.length === 0) continue;
      const owners = new Set(regionTerrs.map((t: any) => t.dono_id).filter(Boolean));
      if (owners.size === 1) {
        const ownerId = [...owners][0] as string;
        const pe = playerEstados.find((p: any) => p.player_id === ownerId);
        if (pe) {
          pe.spice = (pe.spice || 0) + REGION_BONUS_SPICE;
          logs.push({
            partida_id, turno_numero: turnoNum, nivel: "publico",
            mensagem: `🏰 Bônus de região! Controle total da região ${region} → +${REGION_BONUS_SPICE} Spice`,
            dados: { region, bonus: REGION_BONUS_SPICE }, player_id: ownerId,
          });
        }
      }
    }

    // 9. Troop regeneration (+5 per owned territory, +8 for Tleilaxu)
    for (const t of terrArray) {
      if (t.dono_id) {
        const bonus = getHouseBonus(playerEstados, t.dono_id);
        t.forca = Math.min(100, t.forca + 5 + (bonus.regen || 0));
      }
    }

    // Reset fortification (lasts 1 turn)
    for (const action of fortifyActions) {
      const terr = terrMap.get(action.origem_id || action.destino_id);
      if (terr) terr.defesa_base = Math.max(0, terr.defesa_base - 10);
    }

    // CHECK VICTORY
    let vencedorId = null;
    const totalTerr = terrArray.length;
    const ownerCounts = new Map<string, number>();
    for (const t of terrArray) {
      if (t.dono_id) ownerCounts.set(t.dono_id, (ownerCounts.get(t.dono_id) || 0) + 1);
    }
    for (const [pid, count] of ownerCounts) {
      if (count / totalTerr >= 0.6) vencedorId = pid;
    }
    for (const pe of playerEstados) {
      if (pe.spice >= 500) vencedorId = pe.player_id;
    }
    const activePlayers = playerEstados.filter((pe: any) => pe.ativo);
    if (activePlayers.length === 1) vencedorId = activePlayers[0].player_id;

    // UPDATE DATABASE
    for (const t of terrArray) {
      await supabase.from("territorios")
        .update({ forca: t.forca, dono_id: t.dono_id, defesa_base: t.defesa_base })
        .eq("id", t.id).eq("partida_id", partida_id);
    }
    for (const pe of playerEstados) {
      await supabase.from("player_estado")
        .update({ spice: pe.spice, acoes_restantes: 2 })
        .eq("id", pe.id);
    }
    await supabase.from("turnos").update({ resolvido: true, resolved_at: new Date().toISOString() }).eq("id", turno_id);
    if (eventos.length > 0) await supabase.from("eventos").insert(eventos);
    if (logs.length > 0) await supabase.from("game_logs").insert(logs);

    if (vencedorId) {
      await supabase.from("partidas").update({ status: "finished", vencedor_id: vencedorId, updated_at: new Date().toISOString() }).eq("id", partida_id);
      await supabase.from("game_logs").insert({ partida_id, turno_numero: turnoNum, nivel: "publico", mensagem: `🏆 Vitória! Jogador venceu a guerra!`, dados: { vencedor: vencedorId } });
    } else {
      const nextTurno = turnoNum + 1;
      await supabase.from("partidas").update({ turno_atual: nextTurno, updated_at: new Date().toISOString() }).eq("id", partida_id);
      await supabase.from("turnos").insert({ partida_id, numero: nextTurno });
    }

    return new Response(
      JSON.stringify({ success: true, turno: turnoNum, vencedor: vencedorId, wormEvent: wormEventData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
