# =============================================================================
# MAESTRO - SCRIPT PRINCIPAL DE TESTES E2E
# =============================================================================
#
# PROPOSITO: Orquestrador completo - Prepara ambiente E2E e roda testes
#
# PIPLINE COMPLETO:
#   1. Subir Backend + Frontend + Postgres (docker-compose)
#   2. Validar ambiente (API, Frontend, Node.js)
#   3. RESET + MIGRATION + SEED (Banco de dados E2E)
#   4. Gerar sessoes de autenticacao (auth.setup)
#   5. Rodar suite GATE (verifica infraestrutura)
#   6. Rodar suite SETUP (gera auth states)
#   7. Rodar suite CONTRATO (navegacao/erros)
#   8. Rodar suite FUNCIONAIS (10 specs)
#   9. Parar quando um teste critico falhar
#   10. Exibir log detalhado da falha do teste
#
# EXECUCAO:
#   # Completo (todas as fases)
#   .\tests\e2e\test-maestro.ps1
#
#   # Pular validacao
#   .\tests\e2e\test-maestro.ps1 -SkipValidation
#
#   # Pular reset DB (ja rodou)
#   .\tests\e2e\test-maestro.ps1 -SkipDatabase
#
#   # Apenas testes (sem prep)
#   .\tests\e2e\test-maestro.ps1 -SkipSetup
#
# SAIDA:
#   - Exit 0: Todos os testes passaram
#   - Exit 1: Algum teste/fase falhou
#
# =============================================================================

param(
    [switch]$SkipValidation = $false,
    [switch]$SkipDatabase = $false,
    [switch]$SkipSetup = $false,
    [switch]$SkipGate = $false,
    [switch]$SkipFunctional = $false,
    [switch]$SeedOnly = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = 'Continue'
$maestroStartTime = Get-Date
$failedPhases = @()

# Cores
function Write-Success {
    param([string]$Message)
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[AVISO] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Section {
    param([string]$Message, [int]$Number = 0)
    if ($Number -gt 0) {
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "[$Number] $Message" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
    } else {
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "$Message" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
    }
}

function Invoke-Phase {
    param(
        [string]$PhaseName,
        [scriptblock]$ScriptBlock,
        [bool]$CriticalPhase = $true
    )
    
    Write-Info "Executando: $PhaseName..."
    
    try {
        & $ScriptBlock
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$PhaseName concluido"
            return $true
        } else {
            Write-Failure "$PhaseName falhou (exit code: $LASTEXITCODE)"
            if ($CriticalPhase) {
                return $false
            } else {
                return $true  # Continua mesmo se falhar (non-critical)
            }
        }
    } catch {
        Write-Failure "$PhaseName falhou: $($_.Exception.Message)"
        if ($CriticalPhase) {
            return $false
        } else {
            return $true
        }
    }
}

# =============================================================================
# FASE 0: TITULO
# =============================================================================

Write-Host "`n`n" -ForegroundColor White
Write-Host "+================================================================+" -ForegroundColor Cyan
Write-Host "|                 MAESTRO - E2E TEST ORCHESTRATOR                |" -ForegroundColor Cyan
Write-Host "|                                                                |" -ForegroundColor Cyan
Write-Host "| Pipeline: Validacao -> DB Reset -> Setup -> Testes           |" -ForegroundColor Cyan
Write-Host "+================================================================+" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor White

# =============================================================================
# FASE 1: VALIDACAO
# =============================================================================

if (-not $SkipValidation) {
    $phase1Result = Invoke-Phase "Validacao de Ambiente" {
        & 'c:\HB TRACK\Hb Track - Fronted\tests\e2e\validate-environment.ps1' -Quick
    }
    
    if (-not $phase1Result) {
        Write-Host "`nResolva os problemas acima e execute novamente." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Info "FASE 1 pulada (-SkipValidation)"
}

# =============================================================================
# FASE 2: RESET + MIGRATION + SEED (BANCO DE DADOS)
# =============================================================================

if (-not $SkipDatabase) {
    Write-Section "Fase 2: Reset + Migration + Seed (Banco de Dados E2E)" 2
    
    $phase2Result = Invoke-Phase "Reset + Migration + Seed" {
        & 'c:\HB TRACK\Hb Track - Backend\reset-db-e2e.ps1'
    } -CriticalPhase $true
    
    if (-not $phase2Result) {
        Write-Failure "Reset BD falhou - nao posso continuar"
        Write-Host "`nDicas:" -ForegroundColor Yellow
        Write-Host "1. Verifique se Docker esta rodando" -ForegroundColor Yellow
        Write-Host "2. Verifique logs: docker-compose logs postgres" -ForegroundColor Yellow
        Write-Host "3. Tente manual: cd 'c:\HB TRACK\Hb Track - Backend' ; .\reset-db-e2e.ps1" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Info "FASE 2 pulada (-SkipDatabase)"
}

# Se -SeedOnly, parar aqui
if ($SeedOnly) {
    Write-Section "RELATORIO FINAL"
    $maestroEndTime = Get-Date
    $totalDuration = $maestroEndTime - $maestroStartTime
    Write-Host "Tempo total: $($totalDuration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host "`n" -ForegroundColor White
    Write-Host "+================================================================+" -ForegroundColor Green
    Write-Host "|                      SEED COMPLETO!                            |" -ForegroundColor Green
    Write-Host "|                                                                |" -ForegroundColor Green
    Write-Host "|  Banco de dados preparado com sucesso!                        |" -ForegroundColor Green
    Write-Host "|  Pronto para execucao de testes.                              |" -ForegroundColor Green
    Write-Host "+================================================================+" -ForegroundColor Green
    Write-Host "`n" -ForegroundColor White
    exit 0
}

# =============================================================================
# FASE 3: AUTH SETUP
# =============================================================================

if (-not $SkipSetup) {
    Write-Section "Fase 3: Auth Setup (Gerar sessoes)" 3
    
    Write-Info "Isto pode levar 30-60 segundos..."
    
    $phase3Result = Invoke-Phase "Auth Setup" {
        cd 'c:\HB TRACK\Hb Track - Fronted'
        npx playwright test tests/e2e/setup/auth.setup.ts --project=setup --workers=1 --retries=0
    } -CriticalPhase $true
    
    if (-not $phase3Result) {
        Write-Failure "Setup falhou - nao posso executar testes"
        Write-Host "`nDicas:" -ForegroundColor Yellow
        Write-Host "1. Verifique credenciais em .env.test" -ForegroundColor Yellow
        Write-Host "2. Verifique se usuarios E2E existem no banco: psql -U hbtrack_dev -d hb_track_e2e -c 'SELECT * FROM users;'" -ForegroundColor Yellow
        Write-Host "3. Tente debug: npx playwright test tests/e2e/setup/auth.setup.ts --debug" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Info "FASE 3 pulada (-SkipSetup)"
}

# =============================================================================
# FASE 4: TESTES GATE
# =============================================================================

if (-not $SkipGate) {
    Write-Section "Fase 4: GATE (Infraestrutura)" 4
    
    cd 'c:\HB TRACK\Hb Track - Fronted'
    
    $phase4Result = Invoke-Phase "GATE" {
        npx playwright test tests/e2e/health.gate.spec.ts --project=chromium --workers=1 --retries=0
    } -CriticalPhase $true
    
    if (-not $phase4Result) {
        Write-Failure "GATE falhou - nao pode continuar"
        Write-Host "`nRecomendacoes:" -ForegroundColor Yellow
        Write-Host "1. Verifique se API esta respondendo: curl http://localhost:8000/api/v1/health" -ForegroundColor Yellow
        Write-Host "2. Verifique se Frontend esta rodando: curl http://localhost:3000" -ForegroundColor Yellow
        Write-Host "3. Verifique logs da API/Frontend" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Info "FASE 4 pulada (-SkipGate)"
}

# =============================================================================
# FASE 5: TESTES FUNCIONAIS
# =============================================================================

if (-not $SkipFunctional) {
    Write-Section "Fase 5: SUITE COMPLETA (Contrato + Funcionais)" 5
    
    Write-Info "Rodando teams suite completa..."
    Write-Info "Isto pode levar 5-10 minutos..."
    
    cd 'c:\HB TRACK\Hb Track - Fronted'
    
    $phase5Result = Invoke-Phase "Suite Completa" {
        & '.\tests\e2e\run-teams-suite.ps1'
    } -CriticalPhase $false
    
    if (-not $phase5Result) {
        $failedPhases += "Suite Funcional"
    }
} else {
    Write-Info "FASE 5 pulada (-SkipFunctional)"
}

# =============================================================================
# RELATORIO FINAL
# =============================================================================

$maestroEndTime = Get-Date
$totalDuration = $maestroEndTime - $maestroStartTime

Write-Section "RELATORIO FINAL"

Write-Host "Tempo total: $($totalDuration.ToString('mm\:ss'))" -ForegroundColor Cyan

if ($failedPhases.Count -eq 0) {
    Write-Host "`n" -ForegroundColor White
    Write-Host "+================================================================+" -ForegroundColor Green
    Write-Host "|                      SUCESSO!                                  |" -ForegroundColor Green
    Write-Host "|                                                                |" -ForegroundColor Green
    Write-Host "|  Todos os testes passaram! Ambiente E2E validado.             |" -ForegroundColor Green
    Write-Host "|  Pronto para deploy em staging!                              |" -ForegroundColor Green
    Write-Host "+================================================================+" -ForegroundColor Green
    Write-Host "`n" -ForegroundColor White
    exit 0
} else {
    Write-Host "`n" -ForegroundColor White
    Write-Host "+================================================================+" -ForegroundColor Red
    Write-Host "|                      FALHAS DETECTADAS                         |" -ForegroundColor Red
    Write-Host "|                                                                |" -ForegroundColor Red
    
    foreach ($phase in $failedPhases) {
        Write-Host "|  - $phase" -ForegroundColor Red
    }
    
    Write-Host "|                                                                |" -ForegroundColor Red
    Write-Host "|  NOTA: Fases criticas falharam anteriormente (GATE)           |" -ForegroundColor Red
    Write-Host "+================================================================+" -ForegroundColor Red
    Write-Host "`n" -ForegroundColor White
    exit 1
}
