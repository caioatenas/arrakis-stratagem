
Both can be done together. Two parallel workstreams:

**1. Reset de senha por email** — usa o sistema padrão do Supabase (envio via templates default do Lovable). Sem necessidade de configurar domínio próprio agora — funciona out-of-the-box.

**2. Tooltips contextuais** — adicionar dicas que aparecem na UI já existente (PlayerInfo, GameLog, ResolveTurnButton) explicando mecânicas avançadas, sem expandir o tutorial linear (que ficaria longo demais).

---

## Parte 1: Reset de Senha

**Fluxo:**
- Em `AuthPage.tsx`, adicionar link "Esqueci minha senha" abaixo do botão de login
- Ao clicar, mostrar mini-form pedindo email → chamar `supabase.auth.resetPasswordForEmail(email, { redirectTo: <URL>/reset-password })`
- Criar nova rota `/reset-password` (`ResetPasswordPage.tsx`) que detecta o token na URL (Supabase coloca em hash), pede nova senha, chama `supabase.auth.updateUser({ password })`
- Registrar rota em `App.tsx`
- Toast de confirmação após envio + após troca

**Sem custom domain:** os emails sairão do remetente padrão do Lovable Cloud — funciona imediatamente para testes. Se depois quiser branding próprio, configuramos domínio.

## Parte 2: Tooltips Contextuais

Usar `Tooltip`/`HoverCard` (já instalados) para "info hotspots" (ícone ℹ️) em pontos-chave:

- **PlayerInfo** — tooltip no spice atual explicando: salário a cada 3 turnos (1 spice/tropa) e deserção se faltar
- **PlayerInfo** — tooltip no contador de turno mostrando próximo turno de salário
- **ResolveTurnButton** — tooltip explicando resolução simultânea + evento Sandworm (duplas em 2d6)
- **GameLog** — pequeno header com ℹ️ explicando os 3 níveis de visibilidade dos logs
- **VictoryProgress** — tooltip com as condições de vitória (70% territórios ou 800 spice)
- **ActionPanel** (quando atacar selecionado) — tooltip com fórmula anti-snowball (multiplicador 0.6)

Componente novo reutilizável: `<InfoHint text="..." />` — ícone ℹ️ pequeno, neutro, com `HoverCard` no clique/hover, estilizado no tema desert/board game.

## Arquivos afetados

**Novos:**
- `src/pages/ResetPasswordPage.tsx`
- `src/components/ui/InfoHint.tsx`

**Editados:**
- `src/pages/AuthPage.tsx` — link "esqueci senha" + estado/form
- `src/App.tsx` — rota `/reset-password`
- `src/components/game/PlayerInfo.tsx` — hints sobre spice/salário/turno
- `src/components/game/ResolveTurnButton.tsx` — hint sobre resolução + worm
- `src/components/game/GameLog.tsx` — hint sobre visibilidade
- `src/components/game/VictoryProgress.tsx` — hint sobre condições
- `src/components/game/ActionPanel.tsx` — hint sobre combate (no fluxo de ataque)

Sem mudanças no banco. Sem novas dependências. Sem Edge Functions.
