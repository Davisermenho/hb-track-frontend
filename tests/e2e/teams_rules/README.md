# Manual Completo de Testes E2E - Módulo Teams

> **Versão**: 2.0  
> **Última atualização**: Janeiro 2026  
> **Total de Testes**: ~300+ (17 arquivos spec)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Estrutura Completa de Arquivos](#2-estrutura-completa-de-arquivos)
3. [Descrição Detalhada de Cada Arquivo](#3-descrição-detalhada-de-cada-arquivo)
4. [Todos os Grupos e Casos de Teste](#4-todos-os-grupos-e-casos-de-teste)
5. [Helpers e Configuração](#5-helpers-e-configuração)
6. [Ordem Canônica de Execução](#6-ordem-canônica-de-execução)
7. [Configuração de Ambiente](#7-configuração-de-ambiente)
8. [Comandos de Execução](#8-comandos-de-execução)
9. [Documentação de Execução e Correções](#9-documentação-de-execução-e-correções)
10. [Validação Final](#10-validação-final)
11. [Regras de Diagnóstico](#11-regras-de-diagnóstico)
12. [Localização de Arquivos de Regras](#12-localização-de-arquivos-de-regras)

---

## 1. Visão Geral

### O que são estes testes?

Testes End-to-End (E2E) automatizados usando **Playwright** que validam o módulo `/teams` do HB Track. Os testes simulam interações reais de usuários no navegador.

### Objetivo

- Validar fluxos críticos de navegação e autenticação
- Garantir funcionamento do CRUD de equipes
- Verificar permissões (RBAC) por role
- Testar todas as abas: Overview, Members, Trainings, Stats, Settings
- Detectar regressões antes do deploy

### Princípios Fundamentais

| Regra | Descrição |
|-------|-----------|
| **Determinísticos** | Mesmo resultado em 10 execuções seguidas |
| **Isolados** | Cada teste controla seu próprio estado |
| **Estáveis** | Assertions em sinais estáveis (URL + testid) |
| **Limpos** | Cleanup automático após execução |
| **Sem Skip** | 0 testes skipados na validação final |
| **Sem Retry** | `--retries=0` na validação final |

---

## 2. Estrutura Completa de Arquivos

```
Hb Track - Fronted/tests/e2e/

  health.spec.ts                    # Health check básico (5 testes)
  health.gate.spec.ts               # Smoke test - Gate Camada 1 (3 testes)

  setup/
    auth.setup.ts                    # Setup de autenticação (6 roles)
    global-teardown.ts               # Limpeza global E2E
    simple-auth.setup.ts.bak         # Backup (não usar)

  helpers/
    api.ts                           # Helpers de API (1268 linhas)
    debug.ts                         # Debug avançado "Caixa Preta" (435 linhas)
    waits.ts                         # Helpers de espera/hidratação (374 linhas)
    selectors.ts                     # Seletores comuns
    redirectDebug.ts                 # Debug de redirects
    index.ts                         # Exports

  teams/                            # TESTES BASE (8 arquivos, ~157 testes)
    teams.auth.spec.ts               # Autenticação por role (26 testes)
    teams.contract.spec.ts           # Contratos de navegação (18 testes)
    teams.crud.spec.ts               # CRUD completo (30 testes)
    teams.invites.spec.ts            # Sistema de convites (26 testes)
    teams.rbac.spec.ts               # RBAC básico (10 testes)
    teams.routing.spec.ts            # Routing/redirects (14 testes)
    teams.states.spec.ts             # Estados UI (16 testes)
    teams.welcome.spec.ts            # Welcome flow (17 testes)

  teams_gaps/                       # TESTES COMPLEMENTARES (9 arquivos, ~127 testes)
    01.trainings.spec.ts             # Aba Treinos
    02.stats.spec.ts                 # Aba Estatísticas
    03.members-management.spec.ts    # Gestão de membros
    04.empty-states.spec.ts          # Estados vazios
    05.testids-coverage.spec.ts      # Cobertura de TestIDs
    06.rbac-extended.spec.ts         # RBAC estendido
    07.team-card-actions.spec.ts     # Ações do card
    08.navigation-deep.spec.ts       # Deep links e navegação
    09.athletes-registrations.spec.ts # Atletas e registrations
    README.md                        # Documentação dos gaps

  teams_rules/                      # DOCUMENTAÇÃO DE REGRAS
    README.md                        #  ESTE ARQUIVO
    RODAR_TEAMS.md                   # Manual canônico de execução
    teams-CONTRACT.md                # Contrato do módulo Teams
    team_tests_rules.md              # Regras de testes determinísticos
    system_rules.md                  # Regras do sistema
    Nivel 3.md                       # Documentação adicional

  tests_log/                        # LOGS DE EXECUÇÃO
     CHANGELOG.md                     # Registro de correções aplicadas
     RUN_LOG.md                       # Registro de execuções
     TESTIDS_MANIFEST.md              # Manifesto de data-testid
```

### Arquivos de Configuração (raiz do frontend)

| Arquivo | Descrição |
|---------|-----------|
| `playwright.config.ts` | Configuração principal: timeouts, browsers, workers |
| `.env.test` | Variáveis de ambiente para testes |
| `.env.local` | Variáveis locais (credenciais E2E) |

### Diretórios de Saída

| Diretório | Descrição |
|-----------|-----------|
| `playwright/.auth/` | Estados de autenticação salvos (6 arquivos JSON) |
| `playwright-report/` | Relatórios HTML |
| `test-results/` | Screenshots, vídeos, traces |

---

## 3. Descrição Detalhada de Cada Arquivo

### 3.1 Health Checks

#### `health.spec.ts` - Health Check Básico
**Propósito**: Verificar infraestrutura antes de rodar a suíte completa

| Grupo | Testes |
|-------|--------|
| **Infraestrutura** | backend API respondendo, frontend /signin carrega, frontend / carrega |
| **Rotas Protegidas** | /teams redireciona para /signin, /inicio redireciona para /signin |

#### `health.gate.spec.ts` - Smoke Test (Gate - Camada 1)
**Propósito**: Validar que infraestrutura está UP antes de qualquer spec

| Teste | Descrição |
|-------|-----------|
| Backend responde | Verifica /health ou /docs |
| Frontend carrega /signin | Formulário visível |
| Rota protegida redireciona | /teams  /signin?callbackUrl |

---

### 3.2 Setup

#### `auth.setup.ts` - Autenticação
**Propósito**: Gerar storageState para diferentes roles

| Role | Arquivo Gerado | Email |
|------|----------------|-------|
| Admin | `admin.json` | `e2e.admin@teste.com` |
| Dirigente | `dirigente.json` | `e2e.dirigente@teste.com` |
| Coordenador | `coordenador.json` | `e2e.coordenador@teste.com` |
| Coach | `coach.json` | `e2e.treinador@teste.com` |
| Atleta | `atleta.json` | `e2e.atleta@teste.com` |
| User | `user.json` | Cópia de admin.json |

#### `global-teardown.ts` - Limpeza Global
**Propósito**: Segunda linha de defesa para cleanup

- Só executa se `E2E=1`
- Apaga teams com nome `E2E-%`
- Preserva team base do seed (`e2e00000-0000-0000-0004-000000000001`)

---

### 3.3 Testes Base (`teams/`)

#### `teams.auth.spec.ts` - Autenticação (~26 testes)

| Grupo | Testes | Descrição |
|-------|--------|-----------|
| **Sem autenticação** | 3 | Redirect /teams  /signin, callbackUrl, redirect detalhe |
| **Admin/Superadmin** | 5 | Acesso /teams, botão criar, overview, members, cookie |
| **Dirigente** | 4 | Acesso /teams, lista, botão criar, cookie |
| **Coordenador** | 4 | Acesso /teams, lista, botão criar, cookie |
| **Treinador** | 3 | Autenticação, acesso /teams, botão criar |
| **Atleta** | 4 | Autenticação, acesso restrito, tabs |
| **Cookies** | 3 | Validação de tokens por role |

#### `teams.contract.spec.ts` - Contratos de Navegação (~18 testes)

| Seção | Testes | Descrição |
|-------|--------|-----------|
| **401 - Sem Auth** | 3 | /teams, /teams/:id/overview, /teams/:id/members |
| **Redirects Canônicos** | 3 | /:id  /overview, tab inválida, case insensitive |
| **404 - Não Encontrado** | 4 | UUID inválido, UUID inexistente |
| **Root TestIDs** | 4 | /teams, /overview, /members, /settings |
| **Marcadores Estáveis** | 4 | create-team-btn, team-name, invite-member-btn |

#### `teams.crud.spec.ts` - CRUD Principal (~30 testes)

| Grupo | Testes | Descrição |
|-------|--------|-----------|
| **Create** | 6 | Modal, validação campos, criação válida, erro nome curto |
| **Read** | 5 | Lista, detalhes, SSR, cache |
| **Update** | 5 | Atualizar nome, persistência, auto-save blur |
| **Delete** | 6 | Botão delete (owner), deletar via UI, confirmação, soft delete |
| **Members** | 8 | Modal convite, validação email, convidar, listar |

#### `teams.invites.spec.ts` - Sistema de Convites (~26 testes)

| Grupo | Testes | Descrição |
|-------|--------|-----------|
| **API Sprint 1** | 6 | Criar convite, listar, duplicado, cancelar, reenviar |
| **UI** | 6 | Botão convidar, modal, validação email, pendentes |
| **Welcome Flow Sprint 2** | 5 | Redirect sem token, erro token inválido |
| **RBAC** | 4 | Permissão para ver lista |
| **Edge Cases** | 5 | Team não encontrado, token expirado |

#### `teams.rbac.spec.ts` - Permissões RBAC (~10 testes)

| Grupo | Testes | Descrição |
|-------|--------|-----------|
| **Usuário autenticado** | 4 | Ver botão criar, acessar overview, members, convidar |
| **Admin** | 3 | Settings tab, deletar equipe, permissões totais |
| **Membro** | 3 | Restrições de acesso |

#### `teams.routing.spec.ts` - Navegação (~14 testes)

| Grupo | Testes | Descrição |
|-------|--------|-----------|
| **Navegação básica** | 4 | /teams, /overview, /members, /settings |
| **Redirects canônicos** | 2 | /:id  /overview, tab inválida |
| **404** | 2 | Non-UUID, UUID inexistente |
| **Tabs** | 6 | Navegação entre tabs |

#### `teams.states.spec.ts` - Estados UI (~16 testes)

| Grupo | Testes | Descrição |
|-------|--------|-----------|
| **Empty State** | 2 | Botão criar visível, CTA |
| **Loading State** | 2 | Skeleton, botão desabilitado |
| **Error State** | 3 | Toast erro, API falha, error boundary |
| **Form Validation** | 5 | Nome curto, corrigir erro, gender, category |
| **Success State** | 4 | Toast sucesso criar, atualizar, convidar |

#### `teams.welcome.spec.ts` - Fluxo Welcome (~17 testes)

| Grupo | Testes | Descrição |
|-------|--------|-----------|
| **Token Verification (API)** | 2 | Token inválido, token vazio |
| **UI Token Inválido** | 2 | Erro na página, redirect sem token |
| **Fluxo Completo** | 8 | Convite pendente, token válido, formulário, completar |
| **Edge Cases** | 3 | Token já usado, token expirado |
| **Permissões de Convite** | 2 | Dirigente pode convidar |

---

### 3.4 Testes Complementares (`teams_gaps/`)

#### `01.trainings.spec.ts` - Aba Treinos
**GAP Coberto**: Aba Treinos sem testes funcionais

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Navegação e Root | 3 | Carregar aba, botão criar, navegar tabs |
| CRUD | 3 | Criar via API, verificar dados, deletar |
| Estados | 2 | Empty state, loading |
| Permissões | 2 | Admin criar, atleta visualizar |

#### `02.stats.spec.ts` - Aba Estatísticas
**GAP Coberto**: Aba Stats sem testes funcionais

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Navegação e Root | 3 | Carregar aba, navegar via tab, reload |
| Empty State | 2 | Equipe nova, mensagem |
| Exportar | 2 | Botão exportar (se implementado) |
| Permissões | 3 | Todos podem ver, exportar (roles específicos) |

#### `03.members-management.spec.ts` - Gestão de Membros
**GAP Coberto**: Alterar papel, remover membro

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Alterar Papel via API | 3 | Endpoint existe, alterar role |
| Remover Membro via API | 3 | Endpoint existe, remover membro |
| Gestão via UI | 5 | Lista, opções ação, cancelar convite |
| RBAC | 3 | Admin/owner pode gerenciar |
| Edge Cases | 3 | Não remover owner, refresh após remoção |

#### `04.empty-states.spec.ts` - Estados Vazios
**GAP Coberto**: Empty states de todas as abas

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Treinos | 2 | Empty state, CTA criar |
| Estatísticas | 2 | Empty state, zeros |
| Membros | 2 | Apenas owner, botão convidar |
| Overview | 2 | Overview sem dados, sem próximo treino |
| Loading States | 2 | Skeleton, loading treinos |
| Transições | 2 | Criar primeiro item, atualizar |

#### `05.testids-coverage.spec.ts` - Cobertura de TestIDs
**GAP Coberto**: Validar TestIDs do TESTIDS_MANIFEST.md

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Team Card | 6 | team-card-${id}, view-team, manage-members, dropdown |
| Create Team Modal | 5 | Modal, close-btn, inputs, erros |
| Overview Tab | 3 | Root, team-name |
| Settings Tab | 3 | Root, danger-zone, confirm-delete-modal |
| Invite Modal | 5 | Modal, input, erro, submit |
| Welcome Flow | 2 | Loading, error |
| Error States | 2 | Not-found, error-boundary |

#### `06.rbac-extended.spec.ts` - RBAC Estendido
**GAP Coberto**: Testes RBAC com todos os roles

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Admin/Owner | 5 | Settings, deletar, convidar, criar treino, stats |
| Dirigente | 2 | Settings, não deletar |
| Coordenador | 3 | Convidar, não Settings, criar treino |
| Treinador | 3 | Criar treino, não convidar, não Settings |
| Atleta/Membro | 4 | Ver stats, não criar, não convidar, não Settings |
| Hierarquia | 2 | Documentada, cumulativa |

#### `07.team-card-actions.spec.ts` - Ações do Card
**GAP Coberto**: Dropdown, Sair, Arquivar

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Dropdown Menu | 4 | Botão mais ações, opções, arquivar, sair |
| Arquivar Equipe | 2 | Soft delete, deleted_at preenchido |
| Sair da Equipe | 2 | Owner não pode sair, membro pode |
| Navegação | 3 | view-team navega, manage-members, click card |
| Estados Visuais | 2 | Nome, informações |

#### `08.navigation-deep.spec.ts` - Deep Links e Navegação
**GAP Coberto**: Deep links, reload, back/forward

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Deep Links - Acesso Direto | 5 | /overview, /members, /trainings, /stats, /settings |
| Reload/F5 - Estabilidade | 5 | F5 em cada rota, múltiplos F5 |
| Browser History | 3 | Back, forward, navegação cria histórico |
| Casos Inválidos | 3 | Tab inválida, UUID inválido, graceful handling |
| Preservação de Estado | 3 | Scroll position, query params, atributos link |
| Sem Autenticação | 2 | Deep link redireciona, callback após login |
| Performance | 2 | Navegação rápida (<5s), deep link (<10s) |

#### `09.athletes-registrations.spec.ts` - Atletas e Registrations
**GAP Coberto**: Team Athletes (registrations)

| Seção | Testes | Descrição |
|-------|--------|-----------|
| Listar via API | 3 | Endpoint existe, lista vazia, filtro active_only |
| Criar via API | 2 | Endpoint existe, dados inválidos |
| Atualizar via API | 1 | Endpoint PATCH existe |
| Visualização UI | 3 | Seção atletas, botão adicionar, lista vazia |
| Permissões | 2 | Admin ver, vincular atleta |
| Contrato de Dados | 2 | Campos obrigatórios, paginação |

---

## 4. Todos os Grupos e Casos de Teste

### Resumo por Arquivo

| Arquivo | Testes | Camada |
|---------|--------|--------|
| `health.spec.ts` | 5 | Gate |
| `health.gate.spec.ts` | 3 | Gate |
| `auth.setup.ts` | 6 | Setup |
| `teams.auth.spec.ts` | 26 | Funcional |
| `teams.contract.spec.ts` | 18 | Contrato |
| `teams.crud.spec.ts` | 30 | Funcional |
| `teams.invites.spec.ts` | 26 | Funcional |
| `teams.rbac.spec.ts` | 10 | Funcional |
| `teams.routing.spec.ts` | 14 | Funcional |
| `teams.states.spec.ts` | 16 | Funcional |
| `teams.welcome.spec.ts` | 17 | Funcional |
| `01.trainings.spec.ts` | 10 | Gap |
| `02.stats.spec.ts` | 10 | Gap |
| `03.members-management.spec.ts` | 17 | Gap |
| `04.empty-states.spec.ts` | 12 | Gap |
| `05.testids-coverage.spec.ts` | 26 | Gap |
| `06.rbac-extended.spec.ts` | 19 | Gap |
| `07.team-card-actions.spec.ts` | 13 | Gap |
| `08.navigation-deep.spec.ts` | 23 | Gap |
| `09.athletes-registrations.spec.ts` | 13 | Gap |
| **TOTAL** | **~314** | |

---

## 5. Helpers e Configuração

### 5.1 `helpers/api.ts` - Helpers de API (1268 linhas)

**Propósito**: Infraestrutura determinística para criar/manipular dados via API

#### Funções de Autenticação
```typescript
getAccessTokenFromStorage()      // Lê token do storageState
getAccessTokenFromFile(path)     // Lê token de arquivo específico
loginViaAPI(email, password)     // Login via API, retorna token
```

#### Funções de Teams
```typescript
createTeamViaAPI(request, data, token)   // Cria team, retorna ID
getTeamViaAPI(request, teamId, token)    // Obtém team ou null
updateTeamViaAPI(request, teamId, data)  // Atualiza team
deleteTeamViaAPI(request, teamId)        // Deleta team (soft delete)
listTeamsViaAPI(request)                 // Lista teams
```

#### Funções de Membros
```typescript
inviteMemberViaAPI(request, teamId, email)     // Convida membro
listMembersViaAPI(request, teamId)             // Lista membros
removeMemberViaAPI(request, teamId, memberId)  // Remove membro
updateMemberRoleViaAPI(request, teamId, id, role) // Altera papel
```

#### Funções de Convites
```typescript
createTeamInviteViaAPI(request, teamId, email)  // Cria convite
listTeamInvitesViaAPI(request, teamId)          // Lista convites
cancelTeamInviteViaAPI(request, teamId, id)     // Cancela convite
resendTeamInviteViaAPI(request, teamId, id)     // Reenvia convite
```

#### Funções de Treinos (Sessions)
```typescript
createSessionViaAPI(request, teamId, data)  // Cria treino
getSessionViaAPI(request, sessionId)        // Obtém treino
deleteSessionViaAPI(request, sessionId)     // Deleta treino
```

#### Funções de Welcome
```typescript
verifyWelcomeTokenViaAPI(request, token)           // Verifica token
getWelcomeTokenViaTestAPI(request, email, token)   // Obtém token (E2E)
isE2ETestModuleEnabled(request, token)             // Verifica E2E=1
```

### 5.2 `helpers/debug.ts` - Debug Avançado (435 linhas)

**Propósito**: "Caixa Preta" para diagnóstico de falhas

#### Funções Principais
```typescript
attachDebug(page, testInfo, options)  // Inicia gravação de debug
generateEntityName(prefix, testTitle) // Gera nome determinístico
```

#### O que captura
- Navegações e redirects
- Console errors/warnings
- Page errors
- Request failures
- Document responses com headers de middleware
- WebSocket connections

### 5.3 `helpers/waits.ts` - Helpers de Espera (374 linhas)

**Propósito**: Resolver edge-cases de timing no Windows + Next.js

#### Funções Principais
```typescript
waitForHydration(page, timeout)                      // Espera React hidratar
waitForE2EPathname(page, timeout)                    // Espera pathname
waitForDocumentWithMiddlewareHeader(page, url)       // Valida middleware
expectPathnameEventually(page, pattern, timeout)     // Espera pathname
gotoWithLoopDetection(page, url, maxLoops)           // Detecta loops
```

---

## 6. Ordem Canônica de Execução

### Ordem Obrigatória (NÃO NEGOCIÁVEL)

```

  CAMADA 1: GATE (Se falhar, PARE)                          

  1. health.gate.spec.ts     Infraestrutura UP?            
  2. health.spec.ts          Rotas básicas OK?             
  3. auth.setup.ts           Gerar storageStates           

                              

  CAMADA 2: CONTRATOS                                       

  4. teams.contract.spec.ts  Navegação/redirects OK?       

                              

  CAMADA 3: FUNCIONAL (BASE)                                

  5. teams.auth.spec.ts      Guards/middleware             
  6. teams.routing.spec.ts   Navegação/rotas               
  7. teams.crud.spec.ts      CRUD principal                
  8. teams.states.spec.ts    Estados UI                    
  9. teams.invites.spec.ts   Convites                      
 10. teams.welcome.spec.ts   Welcome flow                  
 11. teams.rbac.spec.ts      Permissões                    

                              

  CAMADA 4: GAPS (COMPLEMENTAR)                             

 12. 01.trainings.spec.ts           Aba Treinos            
 13. 02.stats.spec.ts               Aba Estatísticas       
 14. 03.members-management.spec.ts  Gestão membros         
 15. 04.empty-states.spec.ts        Estados vazios         
 16. 05.testids-coverage.spec.ts    TestIDs                
 17. 06.rbac-extended.spec.ts       RBAC estendido         
 18. 07.team-card-actions.spec.ts   Ações card             
 19. 08.navigation-deep.spec.ts     Deep links             
 20. 09.athletes-registrations.spec.ts  Atletas            

```

### Por que esta ordem?

1. **Gate primeiro**: Se infra está down, não perca tempo
2. **Auth segundo**: Sem auth, nada funciona
3. **Contratos terceiro**: Validar navegação antes de funcionalidades
4. **Funcional quarto**: CRUD e fluxos principais
5. **Gaps por último**: Cobertura complementar

---

## 7. Configuração de Ambiente

### 7.1 Serviços Necessários

| Serviço | URL | Verificação |
|---------|-----|-------------|
| PostgreSQL | localhost:5433 | `psql -h localhost -p 5433 -U hbtrack_dev -d hb_track_e2e` |
| Backend API | http://localhost:8000 | `curl http://localhost:8000/api/v1/health` |
| Frontend | http://localhost:3000 | `curl http://localhost:3000` |

### 7.2 Variáveis de Ambiente

```env
# .env.test ou .env.local
PLAYWRIGHT_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Credenciais E2E (obrigatórias)
TEST_ADMIN_EMAIL=e2e.admin@teste.com
TEST_ADMIN_PASSWORD=Admin@123
TEST_DIRIGENTE_EMAIL=e2e.dirigente@teste.com
TEST_DIRIGENTE_PASSWORD=Admin@123
TEST_COORDENADOR_EMAIL=e2e.coordenador@teste.com
TEST_COORDENADOR_PASSWORD=Admin@123
TEST_COACH_EMAIL=e2e.treinador@teste.com
TEST_COACH_PASSWORD=Admin@123
TEST_ATLETA_EMAIL=e2e.atleta@teste.com
TEST_ATLETA_PASSWORD=Admin@123

# Flags E2E
E2E=1
```

### 7.3 Reset do Banco E2E (OBRIGATÓRIO)

**Executar ANTES de qualquer spec:**

```powershell
# 0. Reset do banco hb_track_e2e (schema limpo)
cd "C:\HB TRACK\infra"
docker compose exec -T postgres psql -U hbtrack_dev -d postgres -c "DROP DATABASE IF EXISTS hb_track_e2e WITH (FORCE);"
docker compose exec -T postgres psql -U hbtrack_dev -d postgres -c "CREATE DATABASE hb_track_e2e;"

# 0.1 Migrations (Alembic)
cd "C:\HB TRACK\Hb Track - Backend\db"
$env:DATABASE_URL="postgresql+psycopg2://hbtrack_dev:hbtrack_dev_pwd@localhost:5433/hb_track_e2e"
python -m alembic upgrade head

# 0.2 Seed E2E
cd "C:\HB TRACK\Hb Track - Backend"
$env:PG_DSN="postgresql://hbtrack_dev:hbtrack_dev_pwd@localhost:5433/hb_track_e2e"
python scripts/seed_e2e.py
```

### 7.4 Usuários E2E Criados pelo Seed

| Role | Email | ID Fixo |
|------|-------|---------|
| Superadmin | `e2e.admin@teste.com` | `e2e00000-0000-0000-0001-000000000001` |
| Dirigente | `e2e.dirigente@teste.com` | `e2e00000-0000-0000-0001-000000000002` |
| Coordenador | `e2e.coordenador@teste.com` | `e2e00000-0000-0000-0001-000000000003` |
| Treinador | `e2e.treinador@teste.com` | `e2e00000-0000-0000-0001-000000000004` |
| Atleta | `e2e.atleta@teste.com` | `e2e00000-0000-0000-0001-000000000005` |

### 7.5 Entidades E2E Fixas

| Entidade | ID Fixo | Descrição |
|----------|---------|-----------|
| Organização | `e2e00000-0000-0000-0000-000000000001` | Organização de teste |
| Team Base | `e2e00000-0000-0000-0004-000000000001` | Equipe base para testes |

---

## 8. Comandos de Execução

### 8.1 Modo Determinístico (SEMPRE usar)

```powershell
# Flags obrigatórias
--project=chromium
--workers=1
--retries=0
```

### 8.2 Execução Completa (Ordem Canônica)

```powershell
cd "c:\HB TRACK\Hb Track - Fronted"

# 1. Health (Gate)
npx playwright test tests/e2e/health.gate.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/health.spec.ts --project=chromium --workers=1 --retries=0

# 2. Auth Setup
npx playwright test tests/e2e/setup/auth.setup.ts --project=setup --workers=1 --retries=0

# 3. Teams Base (ordem canônica)
npx playwright test tests/e2e/teams/teams.contract.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.auth.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.routing.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.crud.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.states.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.invites.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.welcome.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.rbac.spec.ts --project=chromium --workers=1 --retries=0

# 4. Teams Gaps (complementar)
npx playwright test tests/e2e/teams_gaps --project=chromium --workers=1 --retries=0
```

### 8.3 Execução por Arquivo Específico

```powershell
# CRUD
npx playwright test tests/e2e/teams/teams.crud.spec.ts --project=chromium --workers=1 --retries=0

# Gaps de treinos
npx playwright test tests/e2e/teams_gaps/01.trainings.spec.ts --project=chromium --workers=1 --retries=0
```

### 8.4 Execução por Nome de Teste

```powershell
npx playwright test -g "deve criar equipe com dados válidos" --project=chromium --workers=1 --retries=0
```

### 8.5 Modo Debug

```powershell
# Interface gráfica
npx playwright test --ui

# Debug step-by-step
npx playwright test tests/e2e/teams/teams.crud.spec.ts --project=chromium --debug

# Ver relatório
npx playwright show-report
```

---

## 9. Documentação de Execução e Correções

### 9.1 Arquivos de Log

| Arquivo | Propósito | Localização |
|---------|-----------|-------------|
| `CHANGELOG.md` | Registro de correções aplicadas | `tests/e2e/tests_log/` |
| `RUN_LOG.md` | Registro de execuções | `tests/e2e/tests_log/` |
| `TESTIDS_MANIFEST.md` | Manifesto de data-testid | `tests/e2e/tests_log/` |

### 9.2 Formato do RUN_LOG.md

```markdown
## Execução: YYYY-MM-DD (Run X)

### Ambiente
- **Browser**: Chromium
- **Workers**: 1
- **Retries**: 0
- **DB**: hb_track_e2e

### Resultado por Spec
| Spec | Testes | Status | Duração |
|------|--------|--------|---------|
| health.spec.ts | 11 |  PASS | 27.4s |

### Falhas (se houver)
- **Teste**: nome do teste
- **Erro**: descrição
- **Causa**: análise
- **Ação**: correção aplicada
```

### 9.3 Formato do CHANGELOG.md

```markdown
## [YYYY-MM-DD] - Descrição

### Fixed
- **Teste**: nome
- **Problema**: descrição
- **Solução**: o que foi feito
- **Arquivo**: path alterado
```

---

## 10. Validação Final

### 10.1 Critérios de Aceite

```
 PASSOU se:
- 0 failed
- 0 skipped
- 0 flaky
- Em 3 execuções seguidas
- Por browser (chromium mínimo)

 FALHOU se:
- Qualquer teste falhar
- Qualquer teste for skipped
- Resultado diferente entre execuções
```

### 10.2 Comando de Validação (3x)

```powershell
# Executar 3 vezes seguidas - TODAS devem passar
cd "c:\HB TRACK\Hb Track - Fronted"

# Run 1
npx playwright test tests/e2e/teams --project=chromium --workers=1 --retries=0

# Run 2
npx playwright test tests/e2e/teams --project=chromium --workers=1 --retries=0

# Run 3
npx playwright test tests/e2e/teams --project=chromium --workers=1 --retries=0
```

### 10.3 Validação Multi-Browser (opcional)

```powershell
# Firefox
npx playwright test tests/e2e/teams --project=firefox --workers=1 --retries=0

# WebKit
npx playwright test tests/e2e/teams --project=webkit --workers=1 --retries=0
```

---

## 11. Regras de Diagnóstico

### 11.1 Quando um Teste Falhar

```

  PASSO 1: NÃO AJUSTE O TESTE PARA "PASSAR"                 

  1. Abrir trace/screenshot em test-results/                
  2. Ler o erro completo no terminal                        
  3. Verificar CHANGELOG.md se já foi corrigido antes       
  4. Classificar a falha (ver 11.2)                         
  5. Corrigir código OU teste (nunca ambos sem justificativa)
  6. Documentar em CHANGELOG.md                             

```

### 11.2 Classificação de Falhas

| Tipo | Descrição | Ação |
|------|-----------|------|
| **Bug de código** | Componente/API não funciona conforme contrato | Corrigir o código |
| **Bug de teste** | Seletor errado, timing, expectativa errada | Corrigir o teste |
| **Flaky** | Passa e falha aleatoriamente | Identificar race condition |
| **Infraestrutura** | Backend down, banco não resetado | Verificar setup |

### 11.3 O que é PROIBIDO

| Proibido | Motivo |
|----------|--------|
| `test.skip()` | Esconde problema, viola Regra 45 |
| `waitForTimeout(N)` | Espera fixa é não-determinística |
| `networkidle` | Frágil com polling/websockets |
| `try/catch` genérico | Mascara bugs |
| Relaxar assert com `||` | Aceita múltiplos comportamentos |
| Retry > 0 | Esconde instabilidade |

### 11.4 Onde Encontrar Artefatos de Falha

| Artefato | Localização |
|----------|-------------|
| Screenshots | `test-results/[teste]/test-failed-1.png` |
| Vídeos | `test-results/[teste]/video.webm` |
| Traces | `test-results/[teste]/trace.zip` |
| Error Context | `test-results/[teste]/error-context.md` |
| Relatório HTML | `playwright-report/index.html` |

### 11.5 Como Visualizar Trace

```powershell
npx playwright show-trace test-results/[pasta-do-teste]/trace.zip
```

---

## 12. Localização de Arquivos de Regras

### 12.1 Arquivos de Contrato e Regras

| Arquivo | Propósito | Path |
|---------|-----------|------|
| **teams-CONTRACT.md** | Contrato oficial do módulo Teams | `tests/e2e/teams_rules/teams-CONTRACT.md` |
| **RODAR_TEAMS.md** | Manual canônico de execução | `tests/e2e/teams_rules/RODAR_TEAMS.md` |
| **team_tests_rules.md** | Regras de testes determinísticos | `tests/e2e/teams_rules/team_tests_rules.md` |
| **TESTIDS_MANIFEST.md** | Manifesto de data-testid | `tests/e2e/tests_log/TESTIDS_MANIFEST.md` |
| **system_rules.md** | Regras do sistema | `tests/e2e/teams_rules/system_rules.md` |

### 12.2 Arquivos de Regras Globais

| Arquivo | Propósito | Path |
|---------|-----------|------|
| **REGRAS TESTES.md** | Regras globais de testes | `RAG/REGRAS TESTES.md` |
| **DESIGN_SYSTEM.md** | Design system do projeto | `RAG/DESIGN_SYSTEM.md` |

### 12.3 Hierarquia de Consulta

Quando precisar resolver uma dúvida, consultar nesta ordem:

1. **teams-CONTRACT.md**  Comportamento esperado do módulo
2. **TESTIDS_MANIFEST.md**  TestIDs oficiais
3. **team_tests_rules.md**  Regras de testes determinísticos
4. **RODAR_TEAMS.md**  Como executar corretamente
5. **CHANGELOG.md**  Se já foi corrigido antes
6. **RUN_LOG.md**  Histórico de execuções

---

## Resumo de Comandos Rápidos

```powershell
# Preparação
cd "C:\HB TRACK\infra"
docker compose exec -T postgres psql -U hbtrack_dev -d postgres -c "DROP DATABASE IF EXISTS hb_track_e2e WITH (FORCE);"
docker compose exec -T postgres psql -U hbtrack_dev -d postgres -c "CREATE DATABASE hb_track_e2e;"
cd "C:\HB TRACK\Hb Track - Backend\db"
$env:DATABASE_URL="postgresql+psycopg2://hbtrack_dev:hbtrack_dev_pwd@localhost:5433/hb_track_e2e"
python -m alembic upgrade head
cd "C:\HB TRACK\Hb Track - Backend"
$env:PG_DSN="postgresql://hbtrack_dev:hbtrack_dev_pwd@localhost:5433/hb_track_e2e"
python scripts/seed_e2e.py

# Execução
cd "c:\HB TRACK\Hb Track - Fronted"
npx playwright test tests/e2e/health.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/setup/auth.setup.ts --project=setup --workers=1 --retries=0
npx playwright test tests/e2e/teams --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams_gaps --project=chromium --workers=1 --retries=0

# Debug
npx playwright test --ui
npx playwright show-report
npx playwright show-trace test-results/[pasta]/trace.zip

# Validação final (3x)
npx playwright test tests/e2e/teams --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams --project=chromium --workers=1 --retries=0
```

---

> **Última atualização**: Janeiro 2026  
> **Versão do Playwright**: 1.57.0  
> **Mantido por**: Equipe HB Track
