# Run Log - Execuções E2E Teams Module

## Execução #1 - 14/01/2026

**Data/Hora**: 14/01/2026 (hora atual)
**Comando**: `.\tests\e2e\run-e2e-teams.ps1`
**Projeto**: chromium
**Status**: 🔄 EM EXECUÇÃO

### Preparação

✅ **Fase 1: Validação de Ambiente**
- Node.js v24.12.0
- Playwright Version 1.57.0
- API Backend online (localhost:8000)
- Frontend online (localhost:3000)

✅ **Fase 2: Database - Reset + Migration + Seed**
- Reset completo do banco
- PostgreSQL iniciado
- Database hb_track_e2e criado
- 35 migrações aplicadas (alembic upgrade heads)
- Seed E2E completo:
  - 8 usuários criados
  - 6 org_memberships
  - 1 equipe base E2E
  - 1 temporada E2E  
  - 6 team memberships
  - 3 matches E2E
  - 3 training sessions E2E
- **Tempo**: 00:07

🔄 **Fase 3: GATE - health.gate.spec.ts**
- Status: Executando...

### Correções Aplicadas

1. **Script run-e2e-teams.ps1**:
   - Corrigido bloco `param` com caracteres `\n` literais
   - Sintaxe corrigida para PowerShell padrão

2. **Script reset-db-e2e.ps1** (CRIADO):
   - Criado script completo de reset/migration/seed
   - Configurado para usar `DATABASE_URL_SYNC` (alembic env.py)
   - Usa `python -m alembic upgrade heads` (múltiplas heads)
   - Ignora erro de encoding Unicode no final do seed_e2e.py
   - Validação de sucesso via match de string "training sessions E2E criados"

3. **Alembic**:
   - Configurado para usar `heads` em vez de `head` (2 branches detectadas)
   - Variáveis de ambiente configuradas corretamente

### Observações

- ⚠️ Warning do bcrypt sobre `__about__` - não impacta funcionamento
- ⚠️ UnicodeEncodeError no seed_e2e.py - apenas cosmético, seed completou com sucesso
- ⚠️ "RBAC system not populated" nas migrations - populado corretamente pelo seed_e2e.py

### Próximos Passos

- Aguardar conclusão da execução
- Analisar resultados por fase (GATE → SETUP → CONTRATO → FUNCIONAIS)
- Documentar falhas encontradas
- Aplicar correções conforme regras canônicas

---

## Template para Próximas Execuções

```markdown
## Execução #N - DD/MM/YYYY

**Data/Hora**: 
**Comando**: 
**Projeto**: 
**Status**: 

### Resultado
- Testes executados:
- ✅ Passaram:
- ❌ Falharam:
- Tempo total:

### Falhas Detectadas
1. **Teste**: nome.spec.ts
   - **Motivo**: 
   - **Classificação**: [ ] Bug código [ ] Bug teste
   - **Trace**: test-results/.../trace.zip
   - **Ação tomada**:

### Correções Aplicadas
1. **Arquivo**: caminho/arquivo
   - **Mudança**: descrição
   - **Re-run**: comando usado
   - **Resultado**: [ ] Passou [ ] Falhou
```
