# Consolidação de Scripts E2E

## Data: 2026-01-12

## Problema Identificado

Existiam **3 scripts PowerShell** com responsabilidades sobrepostas e confusas:

1. **validate-environment.ps1** (193 linhas)
   - Apenas valida pré-requisitos
   - Não executa testes

2. **run-teams-suite.ps1** (221 linhas)
   - Roda GATE → SETUP → CONTRATO → FUNCIONAIS
   - Não prepara ambiente (seed)
   - Assume que database já está pronto

3. **test-maestro.ps1** (299 linhas)
   - Tentava ser o orquestrador completo
   - **PROBLEMA**: Hard-coded com paths absolutos
   - Chamava os outros 2 scripts
   - Não funcionava de qualquer diretório

### Problemas Específicos

- **Confusão**: 3 arquivos fazendo coisas parecidas
- **Manutenção**: Mudanças precisavam ser replicadas em múltiplos arquivos
- **Portabilidade**: Paths absolutos no test-maestro.ps1 (linhas 137, 156, 198, 252)
- **Usabilidade**: Usuário não sabia qual script usar

## Solução Implementada

### Novo Arquivo Único: `run-e2e-teams.ps1`

Pipeline completo em **1 único arquivo** (430 linhas):

```
PIPELINE E2E TEAMS:
├─ 1. VALIDAÇÃO   → API/Frontend online, Node.js, Playwright
├─ 2. DATABASE    → Reset + Migration + Seed E2E
├─ 3. GATE        → health.gate.spec.ts (infraestrutura)
├─ 4. SETUP       → auth.setup.ts (storage states)
├─ 5. CONTRATO    → teams.contract.spec.ts (navegação/erros)
└─ 6. FUNCIONAIS  → 10 specs de features
```

### Características

✅ **Portável**: Detecta automaticamente diretórios (Frontend/Backend)
✅ **Completo**: Faz tudo - desde validação até relatório final
✅ **Flexível**: Flags para pular fases
✅ **Robusto**: Trata bug do Node.js Windows (exit code 127)
✅ **Claro**: Mensagens coloridas e relatório consolidado

### Flags Disponíveis

```powershell
# Pipeline completo
.\tests\e2e\run-e2e-teams.ps1

# Pular validação (já validado)
.\tests\e2e\run-e2e-teams.ps1 -SkipValidation

# Pular database (seed já rodou)
.\tests\e2e\run-e2e-teams.ps1 -SkipDatabase

# Pular GATE (infraestrutura já validada)
.\tests\e2e\run-e2e-teams.ps1 -SkipGate

# Apenas seed (sem rodar testes)
.\tests\e2e\run-e2e-teams.ps1 -SeedOnly

# Debug verbose
.\tests\e2e\run-e2e-teams.ps1 -Verbose
```

## Comparação

| Aspecto | Antes (3 arquivos) | Depois (1 arquivo) |
|---------|-------------------|-------------------|
| **Linhas totais** | 713 linhas | 430 linhas |
| **Manutenção** | Mudanças em 3 lugares | Mudanças em 1 lugar |
| **Clareza** | Confuso qual usar | Óbvio: run-e2e-teams.ps1 |
| **Portabilidade** | Hard-coded paths | Auto-detect diretórios |
| **Completo** | Precisava combinar 2-3 scripts | 1 script faz tudo |

## O Que Fazer com os Arquivos Antigos

### Opção 1: Deprecar (Recomendado)

Manter os arquivos antigos mas adicionar aviso:

```powershell
Write-Warning "Este script foi deprecado. Use: .\tests\e2e\run-e2e-teams.ps1"
```

### Opção 2: Remover

Deletar os 3 arquivos antigos:
- validate-environment.ps1
- run-teams-suite.ps1
- test-maestro.ps1

## Migração para CI/CD

O novo script é ideal para CI/CD:

```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E Tests
  run: |
    cd "Hb Track - Fronted"
    .\tests\e2e\run-e2e-teams.ps1
```

## Benefícios

1. **Simplicidade**: 1 comando para tudo
2. **Confiabilidade**: Menos pontos de falha
3. **Manutenibilidade**: Mudanças em 1 lugar só
4. **Documentação**: Pipeline auto-explicativo
5. **Portabilidade**: Funciona de qualquer diretório

## Próximos Passos

1. ✅ Criar run-e2e-teams.ps1
2. ⏳ Testar pipeline completo
3. ⏳ Deprecar scripts antigos
4. ⏳ Atualizar documentação (README.md)
5. ⏳ Configurar CI/CD para usar novo script

---

**Status**: ✅ IMPLEMENTADO
**Autor**: Claude Code
**Data**: 2026-01-12
