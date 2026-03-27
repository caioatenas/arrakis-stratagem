import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function d10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

// Region definitions for bonus calculation
const REGIONS = ["norte", "centro", "sul", "leste"];
const REGION_BONUS_SPICE = 15;

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

    // Track which players attacked this turn (for movement restriction)
    const playersWhoAttacked = new Set<string>();

    // 1. RESOLVE MOVEMENTS
    const moveActions = (acoes || []).filter((a: any) => a.tipo === "mover");
    for (const action of moveActions) {
      const origem = terrMap.get(action.origem_id);
      const destino = terrMap.get(action.destino_id);
      if (!origem || !destino) continue;
      if (origem.dono_id !== action.player_id) continue;
      if (!origem.vizinhos.includes(action.destino_id)) continue;

      // Can't move to enemy territory (that's an attack)
      if (destino.dono_id && destino.dono_id !== action.player_id) continue;

      // Max 50% of origin force
      const maxMove = Math.floor(origem.forca / 2);
      const qty = Math.min(action.quantidade || 0, maxMove);
      if (qty <= 0) continue;

      // Must leave at least 1 unit
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

      playersWhoAttacked.add(action.player_id);

      // Empty territory = auto-conquest
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
      const ataque = origem.forca + atkRoll;
      const defesa = destino.forca + defRoll + destino.defesa_base;
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

    // 6. REGION BONUS — +15 spice if player controls all territories in a region
    const terrArray = Array.from(terrMap.values());
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

    // 7. GENERATE EVENT
    const eventTypes = ["tempestade", "vermes", "superproducao", "instabilidade"];
    const eventIdx = Math.floor(Math.random() * eventTypes.length);
    const eventType = eventTypes[eventIdx];
    const eventos: Array<{ turno_id: string; partida_id: string; tipo: string; descricao: string; territorios_afetados: string[] }> = [];

    switch (eventType) {
      case "tempestade": {
        const affected = terrArray.filter(() => Math.random() < 0.3);
        for (const t of affected) t.forca = Math.max(0, t.forca - 15);
        eventos.push({ turno_id, partida_id, tipo: "tempestade", descricao: `Tempestade de areia! ${affected.length} territórios (-15 força)`, territorios_afetados: affected.map((t: any) => t.id) });
        logs.push({ partida_id, turno_numero: turnoNum, nivel: "publico", mensagem: `🌪️ Tempestade de areia afetou ${affected.length} territórios!`, dados: {} });
        break;
      }
      case "vermes": {
        const target = terrArray[Math.floor(Math.random() * terrArray.length)];
        target.forca = Math.max(0, target.forca - 20);
        eventos.push({ turno_id, partida_id, tipo: "vermes", descricao: `Verme da areia em ${target.nome}! (-20 força)`, territorios_afetados: [target.id] });
        logs.push({ partida_id, turno_numero: turnoNum, nivel: "publico", mensagem: `🪱 Verme da areia atacou ${target.nome}!`, dados: {} });
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

    if (Math.random() < 0.3) {
      const extraIdx = (eventIdx + 1 + Math.floor(Math.random() * 3)) % eventTypes.length;
      logs.push({ partida_id, turno_numero: turnoNum, nivel: "publico", mensagem: `⚠️ Evento adicional: ${eventTypes[extraIdx]}!`, dados: {} });
    }

    // Apply +5 force per turn per owned territory
    for (const t of terrArray) {
      if (t.dono_id) t.forca = Math.min(100, t.forca + 5);
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
      JSON.stringify({ success: true, turno: turnoNum, vencedor: vencedorId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
