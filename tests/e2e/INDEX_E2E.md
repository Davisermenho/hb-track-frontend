# Índice E2E - Teams Module

**Atualizado:** 14/01/2026  
**Versão:** 2.0 (com scripts otimizados)

---

## 📜 Scripts de Execução

### 🚀 Pipeline Completo (Recomendado)

```powershell
.\tests\e2e\run-e2e-teams.ps1
```

**O que faz:** Executa pipeline completo:
1. Validação de ambiente (API + Frontend rodando)
2. Reset database + Seed E2E
3. Gate (health checks)
4. Setup (storage states de autenticação)
5. Contrato (navegação, redirects, 404s)
6. Funcionais (13 specs, 223 testes)

**Tempo estimado:** 8-12 minutos  
**Use quando:** Build completo, CI/CD, validação antes de deploy

---

### ⚡ Testes de Validação (Rápido)

```powershell
.\tests\e2e\run-validation-tests.ps1
```

**O que faz:** Executa apenas specs de validação crítica:
- `teams.welcome.spec.ts` - Validação categoria R15, campos obrigatórios
- `teams.invites.spec.ts` - Duplicatas, emails inválidos
- `teams.crud.spec.ts` - Validações de formulário

**Tempo estimado:** 2-3 minutos  
**Use quando:** Mudanças em validações backend, pre-commit, CI rápido

**Modo Quick (pula setup):**
```powershell
.\tests\e2e\run-validation-tests.ps1 -Quick
```

---

### 🎯 Spec Específico (Desenvolvimento)

```powershell
# Rodar apenas um spec
.\tests\e2e\run-e2e-teams.ps1 -Spec teams.welcome

# Rodar múltiplos specs
.\tests\e2e\run-e2e-teams.ps1 -Spec teams.welcome,teams.crud

# Pular validação e seed (ambiente já pronto)
.\tests\e2e\run-e2e-teams.ps1 -Spec teams.welcome -SkipValidation -SkipDatabase
```

**Tempo estimado:** 30-60 segundos por spec  
**Use quando:** Desenvolvimento iterativo, debug de spec específico

---

### 👁️ Modo Watch (Desenvolvimento Ativo)

```powershell
# Watch em spec específico (re-executa ao salvar)
.\tests\e2e\run-e2e-teams.ps1 -Watch -Spec teams.welcome -SkipValidation -SkipDatabase
```

**O que faz:** Re-executa testes automaticamente ao salvar arquivo  
**Use quando:** Desenvolvimento TDD, ajustes incrementais

---

### 🔧 Opções Avançadas

```powershell
# Apenas seed (preparar DB sem rodar testes)
.\tests\e2e\run-e2e-teams.ps1 -SeedOnly

# Pular validação (API já verificada)
.\tests\e2e\run-e2e-teams.ps1 -SkipValidation

# Pular database (seed já rodou)
.\tests\e2e\run-e2e-teams.ps1 -SkipDatabase

# Pular GATE (infraestrutura já validada)
.\tests\e2e\run-e2e-teams.ps1 -SkipGate

# Debug verbose
.\tests\e2e\run-e2e-teams.ps1 -Verbose
```

---

## 📊 Ordem Canônica de Execução

**SEMPRE** respeitar esta ordem:

```
GATE → SETUP → CONTRATO → FUNCIONAIS
```

## 1. GATE (Infraestrutura)

| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `health.gate.spec.ts` | Valida que app/API estão online antes de rodar suite | `npx playwright test tests/e2e/health.gate.spec.ts --project=chromium --workers=1 --retries=0` |

## 2. SETUP (Autenticação)

| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `setup/auth.setup.ts` | Gera storageState para admin, dirigente, coordenador, coach, atleta, user | `npx playwright test tests/e2e/setup/auth.setup.ts --project=setup --workers=1 --retries=0` |

## 3. CONTRATO (Navegação/Erros)

| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.contract.spec.ts` | Redirects (401, canônicos), 404, root testids, marcadores estáveis | `npx playwright test tests/e2e/teams/teams.contract.spec.ts --project=chromium --workers=1 --retries=0` |

**O que este spec valida:**
- **401**: URLs sem auth → /signin?callbackUrl
- **Redirects**: `/teams/:id` → `/teams/:id/overview`, tab inválida → overview
- **404**: UUID inválido, inexistente, deletado
- **Root testids**: teams-dashboard, team-overview-tab, team-members-tab, teams-settings-root
- **Marcadores estáveis**: create-team-btn, invite-member-btn, team-name-input

## 4. FUNCIONAIS

### 4.1. Autenticação e Acesso
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.auth.spec.ts` | Valida acesso por role (admin OK, atleta redirect) | `npx playwright test tests/e2e/teams/teams.auth.spec.ts --project=chromium --workers=1 --retries=0` |

### 4.2. CRUD de Equipes
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.crud.spec.ts` | CREATE, READ, UPDATE, DELETE (soft delete), Members (invite) | `npx playwright test tests/e2e/teams/teams.crud.spec.ts --project=chromium --workers=1 --retries=0` |

**Cobertura CRUD:**
- **Create**: Modal, validação (nome < 3), criação via UI e API
- **Read**: Lista, card, detalhe, navegação
- **Update**: Autosave, persistência, validação
- **Delete**: Botão owner, confirmação modal, soft delete (deleted_at)
- **Members**: Convite (modal, validação email, pending invites)

### 4.3. Estados Visuais
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.states.spec.ts` | Empty, loading, error, form validation, success, cache | `npx playwright test tests/e2e/teams/teams.states.spec.ts --project=chromium --workers=1 --retries=0` |

**Estados cobertos:**
- **Empty**: Botão criar visível
- **Loading**: Botão disabled durante submit, toast sucesso
- **Error**: Toast erro (API 500), validação formulário
- **Success**: Toast após create/update/invite, auto-dismiss
- **Cache**: Invalidação após criação

### 4.4. RBAC (Permissões)
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.rbac.spec.ts` | Permissões por role (admin, coach, member) | `npx playwright test tests/e2e/teams/teams.rbac.spec.ts --project=chromium --workers=1 --retries=0` |

**Cobertura RBAC:**
- Admin: create-team-btn, overview, members, invite-member-btn

### 4.5. Convites (Welcome)
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.welcome.spec.ts` | Fluxo de aceite de convite via token | `npx playwright test tests/e2e/teams/teams.welcome.spec.ts --project=chromium --workers=1 --retries=0` |

### 4.6. Roteamento
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.routing.spec.ts` | Navegação entre abas, deep links, persistência | `npx playwright test tests/e2e/teams/teams.routing.spec.ts --project=chromium --workers=1 --retries=0` |

### 4.7. Invites (Convites detalhados)
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.invites.spec.ts` | Criação, listagem, cancelamento de convites | `npx playwright test tests/e2e/teams/teams.invites.spec.ts --project=chromium --workers=1 --retries=0` |

### 4.8. Treinos
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.trainings.spec.ts` | Aba trainings: navegação, CRUD, empty states, RBAC | `npx playwright test tests/e2e/teams/teams.trainings.spec.ts --project=chromium --workers=1 --retries=0` |

**Cobertura Trainings:**
- **Navegação**: Root testid, botão criar, navegação entre tabs
- **CRUD**: Create/Read/Delete via API, listagem UI
- **Estados**: Empty state
- **RBAC**: Admin vê botão criar

### 4.9. Estatísticas
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.stats.spec.ts` | Aba stats: navegação, estados, permissões, integração | `npx playwright test tests/e2e/teams/teams.stats.spec.ts --project=chromium --workers=1 --retries=0` |

**Cobertura Stats:**
- **Navegação**: Root testid, navegação via tab, reload (F5)
- **Estados**: Empty state, sem erro para equipe válida
- **RBAC**: Admin vê aba, botão exportar
- **Integração**: Navegação Overview ↔ Stats, deep link

### 4.10. Atletas
| Arquivo | Propósito | Comando |
|---------|-----------|---------|
| `teams/teams.athletes.spec.ts` | Registrations (atletas): API, UI, permissões, contrato | `npx playwright test tests/e2e/teams/teams.athletes.spec.ts --project=chromium --workers=1 --retries=0` |

**Cobertura Athletes:**
- **API**: GET/POST/PATCH registrations, filtros
- **UI**: Seção atletas, botão adicionar, lista vazia
- **RBAC**: Admin vê lista, ação vincular
- **Contrato**: Campos obrigatórios, paginação

## Rodar Toda a Suite (Ordem Correta)

```powershell
# 1. Gate
npx playwright test tests/e2e/health.gate.spec.ts --project=chromium --workers=1 --retries=0

# 2. Setup
npx playwright test tests/e2e/setup/auth.setup.ts --project=setup --workers=1 --retries=0

# 3. Contrato
npx playwright test tests/e2e/teams/teams.contract.spec.ts --project=chromium --workers=1 --retries=0

# 4. Funcionais (um por vez)
npx playwright test tests/e2e/teams/teams.auth.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.crud.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.states.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.rbac.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.welcome.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.routing.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.invites.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.trainings.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.stats.spec.ts --project=chromium --workers=1 --retries=0
npx playwright test tests/e2e/teams/teams.athletes.spec.ts --project=chromium --workers=1 --retries=0
```

## Regra de Ouro

**1 comportamento = 1 teste canônico**

Se encontrar teste duplicado, mantenha apenas o canônico (no spec correto conforme ordem acima).

---

## 🔧 Troubleshooting

### ❌ Erro: "API não está rodando"

**Solução:**
```powershell
cd "c:\HB TRACK\Hb Track - Backend"
uvicorn app.main:app --reload
```

Verifique: `http://localhost:8000/api/v1/health`

---

### ❌ Erro: "Frontend não está rodando"

**Solução:**
```powershell
cd "c:\HB TRACK\Hb Track - Fronted"
npm run dev
```

Verifique: `http://localhost:3000`

---

### ❌ Erro: "Seed E2E falhou"

**Causas comuns:**
1. Database não resetada (tabelas com dados antigos)
2. Conexão PostgreSQL incorreta

**Solução:**
```powershell
cd "c:\HB TRACK\Hb Track - Backend"

# Reset completo do database
python scripts/reset_db.py

# Re-executar seed
python scripts/seed_e2e.py
```

---

### ❌ Erro: "Storage states não gerados"

**Causa:** `auth.setup.ts` falhou (credenciais incorretas ou seed incompleto)

**Solução:**
```powershell
# Verificar seed E2E
python scripts/seed_e2e.py

# Re-gerar storage states
npx playwright test tests/e2e/auth.setup.ts --project=chromium
```

Verifique: `tests/e2e/.auth/*.json` devem existir

---

### ⏱️ Testes muito lentos

**Causas:**
- Database com muitos dados (não resetada)
- Muitos workers paralelos
- Modo watch ativado sem querer

**Soluções:**
```powershell
# Reset database
python scripts/reset_db.py
python scripts/seed_e2e.py

# Rodar com 1 worker
npx playwright test <spec> --workers=1

# Limpar cache do Playwright
npx playwright test --clear-cache
```

---

### 🐛 Debug de Spec Específico

```powershell
# Modo debug interativo (abre browser)
npx playwright test tests/e2e/teams/<spec> --project=chromium --workers=1 --retries=0 --debug

# Com headed mode (ver navegador)
npx playwright test tests/e2e/teams/<spec> --project=chromium --headed

# Ver trace (após falha)
npx playwright show-trace test-results/<pasta-do-teste>/trace.zip
```

---

### 📸 Screenshots e Videos

Após falhas, verifique:
```
test-results/
  teams-<spec>-<test-name>/
    test-failed-1.png          # Screenshot da falha
    video.webm                 # Vídeo da execução
    trace.zip                  # Trace completo
```

Para abrir trace:
```powershell
npx playwright show-trace test-results/<pasta>/trace.zip
```

---

### 🆘 Suporte

**Logs detalhados:**
```powershell
.\tests\e2e\run-e2e-teams.ps1 -Verbose
```

**Verificar logs de teste:**
- `tests/e2e/tests_log/CHANGELOG.md` - Histórico de runs
- `test-results/` - Artefatos de cada teste

**Limpar tudo e recomeçar:**
```powershell
# Backend
cd "c:\HB TRACK\Hb Track - Backend"
python scripts/reset_db.py
python scripts/seed_e2e.py

# Frontend
cd "c:\HB TRACK\Hb Track - Fronted"
npx playwright test tests/e2e/auth.setup.ts --project=chromium

# Rodar pipeline completo
.\tests\e2e\run-e2e-teams.ps1
```

---

## Referências

- [REGRAS_TESTES.md](teams_rules/REGRAS_TESTES.md) - 51 regras para E2E
- [MANUAL_TESTES_E2E.md](teams_rules/MANUAL_TESTES_E2E.md) - Guia completo
- [teams-CONTRACT.md](../../../docs/modules/teams-CONTRACT.md) - Contrato da API
- [TESTIDS_MANIFEST.md](teams_rules/TESTIDS_MANIFEST.md) - Lista de test IDs
