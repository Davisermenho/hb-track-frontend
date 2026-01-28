# 🚀 COMO RODAR O PIPELINE COMPLETO E2E

## ✅ ARQUIVOS CRIADOS

### 1. `reset-db-e2e.ps1` (Backend)
**Localização**: `c:\HB TRACK\Hb Track - Backend\reset-db-e2e.ps1`

**O que faz**:
- FASE 1: RESET - Limpa banco (docker-compose down -v)
- FASE 1.5: Inicia Docker PostgreSQL
- FASE 2: MIGRATION - Executa Alembic (29 migrações)
- FASE 3: SEED - Popula dados mínimos (Python ou SQL)

**Execução**:
```powershell
cd 'c:\HB TRACK\Hb Track - Backend'
.\reset-db-e2e.ps1

# Ou pular fases
.\reset-db-e2e.ps1 -SkipReset          # Usar DB existente
.\reset-db-e2e.ps1 -SkipMigration       # DB ja migrado
.\reset-db-e2e.ps1 -SkipSeed            # Dados ja existem
```

---

### 2. `test-maestro.ps1` (Frontend E2E)
**Localização**: `c:\HB TRACK\Hb Track - Fronted\tests\e2e\test-maestro.ps1`

**O que faz**:
- FASE 1: Valida ambiente (API, Frontend, Node.js)
- FASE 2: Reset + Migration + Seed (chama reset-db-e2e.ps1)
- FASE 3: Auth Setup (gera sessões Playwright)
- FASE 4: GATE (verifica infraestrutura)
- FASE 5: Suite Completa (10 specs funcionais)

**Execução**:
```powershell
cd 'c:\HB TRACK\Hb Track - Fronted'

# OPÇÃO A: Primeiro uso (COMPLETO - todas as fases)
.\tests\e2e\test-maestro.ps1

# OPÇÃO B: Próximos usos (sem reset DB)
.\tests\e2e\test-maestro.ps1 -SkipDatabase

# OPÇÃO C: Apenas testes (sem setup)
.\tests\e2e\test-maestro.ps1 -SkipSetup -SkipDatabase

# OPÇÃO D: Debug (sem validacao rápida)
.\tests\e2e\test-maestro.ps1 -Verbose
```

---

## 🎯 PIPELINE VISUAL

```
MAESTRO (test-maestro.ps1)
│
├─► FASE 1: Validacao de Ambiente ✓
│   └─ Verifica: API, Frontend, Node.js, Playwright
│
├─► FASE 2: Reset + Migration + Seed ✓
│   │
│   ├─► reset-db-e2e.ps1
│   │   ├─ RESET: docker-compose down -v
│   │   ├─ INIT: docker-compose up -d (PostgreSQL)
│   │   ├─ MIGRATION: alembic upgrade head (29 migrações)
│   │   └─ SEED: python scripts/seed_e2e.py
│   │
│   └─ Resultado: Banco hb_track_e2e pronto
│
├─► FASE 3: Auth Setup ✓
│   └─ npx playwright test auth.setup.ts
│   └─ Resultado: playwright/.auth/*.json (6 roles)
│
├─► FASE 4: GATE ✓
│   └─ npx playwright test health.gate.spec.ts
│   └─ Resultado: Infraestrutura OK
│
└─► FASE 5: Suite Funcional ✓
    └─ npx playwright test teams/*
    └─ Resultado: 10 specs
```

---

## 📊 FLUXO DE DADOS (O QUE CADA SCRIPT FAZ)

### `reset-db-e2e.ps1` (Banco)

```
ENTRADA:
  - Docker rodando
  - PostgreSQL container
  - Alembic config
  - Python 3.8+
  
PROCESSAMENTO:
  1. Docker: DOWN + Volume DELETE
  2. Docker: UP + PostgreSQL START
  3. Alembic: UPGRADE HEAD (0001 → 0029)
  4. Python: seed_e2e.py OU SQL fallback

SAIDA:
  - Banco hb_track_e2e
  - 4 roles (dirigente, coordenador, treinador, atleta)
  - 65 permissions
  - 6 usuarios E2E:
    * admin@teste.com (superadmin)
    * e2e.dirigente@teste.com
    * e2e.coordenador@teste.com
    * e2e.treinador@teste.com
    * e2e.atleta@teste.com
    * e2e.membro@teste.com
```

### `test-maestro.ps1` (Orquestração)

```
ENTRADA:
  - Backend + Frontend rodando
  - Banco resetado (via reset-db-e2e.ps1)
  
PROCESSAMENTO:
  1. Validacao (pré-requisitos)
  2. Reset DB (chama reset-db-e2e.ps1)
  3. Auth Setup (gera sessões)
  4. GATE (testa infra)
  5. Suite (10 specs)

SAIDA:
  - Exit 0: Sucesso (todos os testes passaram)
  - Exit 1: Falha (alguma fase falhou)
  - playwright-report/: Relatório HTML
  - test-results/: JSON results
```

---

## ⏱️ TEMPO ESTIMADO

| Fase | Tempo |
|------|-------|
| FASE 1: Validacao | ~5 segundos |
| FASE 2: Reset + Migration + Seed | ~30-60 segundos |
| FASE 3: Auth Setup | ~30-60 segundos |
| FASE 4: GATE | ~10-15 segundos |
| FASE 5: Suite Funcional | ~5-10 minutos |
| **TOTAL** | **~7-12 minutos** |

---

## 📋 CHECKLIST DE USO

### Primeira Vez (Setup Completo)
- [ ] API rodando: `curl http://localhost:8000/api/v1/health`
- [ ] Frontend rodando: `curl http://localhost:3000`
- [ ] Docker rodando: `docker ps`
- [ ] Python instalado: `python --version`
- [ ] Alembic instalado: `alembic --version` (ou `python -m alembic`)
- [ ] Execute: `.\tests\e2e\test-maestro.ps1`

### Próximas Vezes (Rápido)
- [ ] Backend/Frontend ja rodando
- [ ] Execute: `.\tests\e2e\test-maestro.ps1 -SkipDatabase`

### Se Falhar
1. **GATE falha**: Verifique API/Frontend
   ```powershell
   curl http://localhost:8000/api/v1/health
   curl http://localhost:3000
   ```

2. **Auth Setup falha**: Verifique usuarios no banco
   ```powershell
   cd 'c:\HB TRACK\Hb Track - Backend'
   psql -U hbtrack_dev -d hb_track_e2e -c "SELECT * FROM users;"
   ```

3. **Reset DB falha**: Verifique Docker
   ```powershell
   docker ps
   docker-compose logs postgres
   ```

---

## 🔧 TROUBLESHOOTING

### Erro: "docker-compose command not found"
```powershell
# Instale Docker Desktop
# https://www.docker.com/products/docker-desktop
```

### Erro: "alembic command not found"
```powershell
# Script usa fallback: python -m alembic
# Ou instale: pip install alembic
```

### Erro: "Python not found"
```powershell
# Script usa SQL fallback automaticamente
# Ou instale Python 3.8+: https://python.org
```

### Erro: "PostgreSQL timeout"
```powershell
# Aumente espera:
cd 'c:\HB TRACK\Hb Track - Backend'
.\reset-db-e2e.ps1 -PostgresWaitSeconds 30
```

### Erro: "Auth setup failed"
```powershell
# Verifique seed foi aplicado:
psql -U hbtrack_dev -d hb_track_e2e -c "SELECT COUNT(*) FROM users;"

# Se vazio, rode manual:
cd 'c:\HB TRACK\Hb Track - Backend'
python scripts/seed_e2e.py
```

---

## 🎯 RESUMO EXECUTIVO

### Para Rodar Testes E2E:

**Primeira Vez**:
```powershell
cd 'c:\HB TRACK\Hb Track - Fronted'
.\tests\e2e\test-maestro.ps1
```

**Próximas Vezes** (DB ja resetado):
```powershell
.\tests\e2e\test-maestro.ps1 -SkipDatabase
```

**Resultado**:
- ✅ Todos testes passam
- ✅ Relatório em: `playwright-report/index.html`
- ✅ Pronto para staging!

---

## 📝 PROXIMOS PASSOS

- [ ] Testar pipeline completo: `.\tests\e2e\test-maestro.ps1`
- [ ] Validar exit code: `echo $LASTEXITCODE`
- [ ] Revisar relatório: `playwright-report/index.html`
- [ ] Integrar no CI/CD (GitHub Actions)
- [ ] Documentar no README

