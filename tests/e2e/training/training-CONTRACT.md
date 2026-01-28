# CONTRATO REAL DO MÓDULO [training]

> **Última atualização:** 2026-01-14
> **Fonte:** Análise do código-fonte implementado
> **Versão:** Resumida para testes E2E

---

## Rotas e Navegação

### Rota Principal
- **URL:** `/training`
- **Comportamento:** Redirect automático para `/training/agenda`

### Subrotas

| Rota | Status | Descrição |
|------|--------|-----------|
| `/training/agenda` | **API REAL** | Agenda semanal de treinos |
| `/training/calendario` | **API REAL** | Calendário mensal |
| `/training/planejamento` | **API REAL** | Ciclos e microciclos |
| `/training/banco` | **MOCK DATA** | Banco de exercícios |
| `/training/avaliacoes` | **MOCK DATA** | Métricas e relatórios |
| `/training/presencas` | **NÃO IMPLEMENTADO** | Placeholder |

### Rota Relacionada
| Rota | Status | Descrição |
|------|--------|-----------|
| `/teams/[teamId]/trainings` | **API REAL** | Aba treinos da equipe |

### Redirects
- `/training` → `/training/agenda`

### 404
- Rotas inexistentes dentro de `/training/*` retornam 404

---

## Autenticação e Autorização

### Middleware
- **Cookie:** `hb_access_token` obrigatório
- **Validação:** Server-side via `getSession()`

### Roles Permitidos
- Todos os usuários autenticados (sem restrição por role no módulo)

### Comportamento sem Auth
- Redirect → `/signin?callbackUrl=[rota-original]`

### Comportamento com Role Errado
- N/A (não há restrição de role específica)

---

## Server Components e Data Fetching

### Quais Pages são Server Components
| Arquivo | Tipo | Função |
|---------|------|--------|
| `layout.tsx` | Server | Valida sessão, wraps TrainingProvider |
| `page.tsx` (todas subrotas) | Server | Valida sessão, renderiza Client |

### APIs Chamadas no Servidor
- Nenhuma - todas as chamadas são client-side via hooks

### Cookies Usados
- `hb_access_token` - Token JWT de autenticação

### Cache Strategy
- `no-store` - Dados sempre fresh via client-side fetch

---

## Client Components e Interações

### Formulários
| Componente | Validações |
|------------|------------|
| `CreateSessionModal` | Soma dos focos ≤ 120%, team_id obrigatório |

### Ações
- Criar sessão
- Editar sessão
- Fechar sessão
- Reabrir sessão (até 24h)
- Deletar sessão (soft delete)
- CRUD de ciclos e microciclos

### Estados
- `loading` - Via hooks (`isLoading`)
- `error` - Via hooks (`error`)
- `empty` - Empty state quando sem dados

### Feedback
- Refetch automático após mutações
- Toast notifications (quando implementado)

---

## Fluxos de Dados (CRUD)

### Training Sessions

| Operação | Endpoint | Payload/Params | Validações | Resposta |
|----------|----------|----------------|------------|----------|
| CREATE | `POST /training-sessions` | `{ organization_id, team_id, session_at, session_type, main_objective?, duration_planned_minutes?, focus_*_pct? }` | team_id obrigatório, soma focos ≤ 120% | `TrainingSession` |
| READ | `GET /training-sessions` | `?team_id=&status=&start_date=&end_date=&page=&limit=` | - | `{ items[], total, page, limit }` |
| READ ONE | `GET /training-sessions/:id` | - | - | `TrainingSession` |
| UPDATE | `PATCH /training-sessions/:id` | Campos parciais | Regras de edição R40 | `TrainingSession` |
| DELETE | `DELETE /training-sessions/:id` | `?reason=` | Soft delete | `204` |
| CLOSE | `POST /training-sessions/:id/close` | - | Soma focos > 0 e ≤ 120%, status draft/in_progress | `TrainingSession` |
| REOPEN | `POST /training-sessions/:id/reopen` | - | Dentro de 24h do fechamento | `TrainingSession` |
| DEVIATION | `GET /training-sessions/:id/deviation` | - | Sessão vinculada a microciclo | `DeviationAnalysis` |

### Training Cycles

| Operação | Endpoint | Payload/Params | Validações | Resposta |
|----------|----------|----------------|------------|----------|
| CREATE | `POST /training-cycles` | `{ team_id, type, start_date, end_date, objective?, parent_cycle_id? }` | start_date < end_date, type in (macro, meso) | `TrainingCycle` |
| READ | `GET /training-cycles` | `?team_id=&cycle_type=&status=` | - | `TrainingCycle[]` |
| READ ONE | `GET /training-cycles/:id` | - | - | `TrainingCycleWithMicrocycles` |
| UPDATE | `PATCH /training-cycles/:id` | Campos parciais | - | `TrainingCycle` |
| DELETE | `DELETE /training-cycles/:id` | `?reason=` | Soft delete | `204` |
| ACTIVE | `GET /training-cycles/teams/:teamId/active` | - | - | `TrainingCycle[]` |

### Training Microcycles

| Operação | Endpoint | Payload/Params | Validações | Resposta |
|----------|----------|----------------|------------|----------|
| CREATE | `POST /training-microcycles` | `{ team_id, week_start, week_end, cycle_id?, planned_focus_*_pct?, planned_weekly_load? }` | week_start < week_end | `TrainingMicrocycle` |
| READ | `GET /training-microcycles` | `?team_id=&cycle_id=&start_date=&end_date=` | - | `TrainingMicrocycle[]` |
| READ ONE | `GET /training-microcycles/:id` | - | - | `TrainingMicrocycleWithSessions` |
| UPDATE | `PATCH /training-microcycles/:id` | Campos parciais | - | `TrainingMicrocycle` |
| DELETE | `DELETE /training-microcycles/:id` | `?reason=` | Soft delete | `204` |
| CURRENT | `GET /training-microcycles/teams/:teamId/current` | - | - | `TrainingMicrocycle \| null` |
| SUMMARY | `GET /training-microcycles/:id/summary` | - | - | `TrainingMicrocycleWithSessions` |

### Training Suggestions

| Operação | Endpoint | Payload/Params | Validações | Resposta |
|----------|----------|----------------|------------|----------|
| GET | `GET /training-suggestions` | `?team_id=&microcycle_type=` | Mínimo 3 microciclos históricos | `TrainingSuggestionsResponse` |
| APPLY | `POST /training-suggestions/apply` | `{ microcycle_id, suggestion }` | - | `TrainingMicrocycle` |

---

## Regras de Negócio

### Focos de Treino
- 7 categorias: ataque posicional, defesa posicional, transição ofensiva, transição defensiva, técnico ataque, técnico defesa, físico
- Cada foco: 0-100%
- **Soma máxima: ≤ 120%** (permite treinos híbridos)

### Status de Sessão
```
draft → in_progress → closed → readonly (após 24h)
```

### Regras de Edição (R40)
- **Autor:** 10 minutos para correções rápidas
- **Superior:** até 24 horas
- **Após 24h:** somente leitura (admin com nota pode editar)

### Reabertura de Sessão
- Apenas dentro de 24h do fechamento
- Após 24h, status muda para `readonly`

### Desvio de Planejamento
- Flag ativada quando: ≥20pts diferença em qualquer foco OU ≥30% agregado
- Usuário pode preencher justificativa

---

## Dependências com Outros Módulos

| Módulo | Relação |
|--------|---------|
| `teams` | Via TrainingContext - seleção de equipe |
| `auth` | Via getSession - autenticação |
| `seasons` | FK opcional em sessões |
| `athletes` | Via attendance e wellness (não implementado) |

---

## Edge Cases e Bugs Conhecidos

### NÃO IMPLEMENTADO
- `/training/banco` - Usa MOCK DATA, endpoint de exercícios não existe
- `/training/avaliacoes` - Usa MOCK DATA, endpoint de analytics não existe
- `/training/presencas` - Placeholder, retorna 501
- Endpoints de attendance - Retornam 501 NOT_IMPLEMENTED
- Endpoints de wellness_pre - Retornam 501 NOT_IMPLEMENTED
- Endpoints de wellness_post - Retornam 501 NOT_IMPLEMENTED

### TODO no Código
- Exportar relatório PDF
- Favoritar exercício
- Busca por tags em exercícios

### Funcionalidades Ausentes
- Duplicar sessão
- Copiar semana de planejamento
- Drag & drop real (UI apenas)

---

## TestIDs Esperados

| TestID | Componente |
|--------|------------|
| `training-agenda-root` | Container da agenda |
| `training-calendario-root` | Container do calendário |
| `training-planejamento-root` | Container do planejamento |
| `training-banco-root` | Container do banco de exercícios |
| `training-avaliacoes-root` | Container das avaliações |
| `create-session-button` | Botão criar sessão |
| `create-session-modal` | Modal de criação |
| `session-card` | Card de sessão na agenda |
| `week-navigation` | Navegação entre semanas |
| `month-navigation` | Navegação entre meses |

---

## Tabelas do Banco (Resumo)

### training_sessions
- Campos principais: `id`, `team_id`, `session_at`, `session_type`, `status`
- 7 campos de foco: `focus_*_pct`
- Soft delete: `deleted_at`, `deleted_reason`

### training_cycles
- Campos principais: `id`, `team_id`, `type` (macro/meso), `start_date`, `end_date`, `status`
- Auto-referência: `parent_cycle_id` para mesociclos

### training_microcycles
- Campos principais: `id`, `team_id`, `week_start`, `week_end`, `cycle_id`
- 7 campos de foco planejado: `planned_focus_*_pct`

### attendance (NÃO IMPLEMENTADO)
- UNIQUE: `training_session_id + athlete_id`

### wellness_pre / wellness_post (NÃO IMPLEMENTADO)
- UNIQUE: `training_session_id + athlete_id`
