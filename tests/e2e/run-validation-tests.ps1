# =============================================================================
# VALIDATION TESTS SUITE - TEAMS MODULE
# =============================================================================
#
# PROPÓSITO: Executar apenas testes de validação críticos do módulo Teams
#
# SPECS INCLUÍDAS:
#   - teams.welcome.spec.ts   (validação categoria R15, campos obrigatórios)
#   - teams.invites.spec.ts   (duplicatas, emails inválidos)
#   - teams.crud.spec.ts      (validações de formulário)
#
# EXECUÇÃO:
#   # Pipeline completo (valida ambiente + seed + testes)
#   .\tests\e2e\run-validation-tests.ps1
#
#   # Quick mode (pula validação e seed - assume ambiente pronto)
#   .\tests\e2e\run-validation-tests.ps1 -Quick
#
#   # Verbose mode (debug detalhado)
#   .\tests\e2e\run-validation-tests.ps1 -Verbose
#
# USO RECOMENDADO:
#   - CI/CD: Para verificar validações críticas rapidamente (~2-3 min)
#   - Pre-commit: Antes de fazer commit de mudanças em validações
#   - Development: Testar apenas validações após mudanças no backend
#
# =============================================================================

param(
    [switch]$Quick = $false,      # Pula validação e seed (assume ambiente pronto)
    [switch]$Verbose = $false     # Output detalhado
)

$ErrorActionPreference = 'Continue'
$startTime = Get-Date

# Garantir que estamos no diretório correto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$backendRoot = Join-Path (Split-Path -Parent $frontendRoot) "Hb Track - Backend"

Set-Location $frontendRoot

# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================

function Write-Success {
    param([string]$Message)
    Write-Host "[OK]   $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Phase {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "$Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

# =============================================================================
# CABEÇALHO
# =============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "        VALIDATION TESTS SUITE - TEAMS MODULE" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host "  Testes de validação críticos: Categoria R15, Duplicatas," -ForegroundColor Cyan
Write-Host "  Campos obrigatórios, Formulários" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($Quick) {
    Write-Info "Modo QUICK ativado - pulando validação e seed"
}

# =============================================================================
# FASE 1: VALIDAÇÃO E SETUP (se não Quick)
# =============================================================================

if (-not $Quick) {
    Write-Phase "PREPARAÇÃO DO AMBIENTE"

    # 1.1. Validar API está rodando
    Write-Info "Verificando API (http://localhost:8000)..."
    try {
        $apiHealth = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "API online"
    } catch {
        Write-Failure "API não está rodando"
        Write-Host ""
        Write-Host "Execute antes: cd 'c:\HB TRACK\Hb Track - Backend'; uvicorn app.main:app --reload" -ForegroundColor Yellow
        exit 1
    }

    # 1.2. Validar Frontend está rodando
    Write-Info "Verificando Frontend (http://localhost:3000)..."
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "Frontend online"
    } catch {
        Write-Failure "Frontend não está rodando"
        Write-Host ""
        Write-Host "Execute antes: cd 'c:\HB TRACK\Hb Track - Fronted'; npm run dev" -ForegroundColor Yellow
        exit 1
    }

    # 1.3. Executar seed E2E
    Write-Info "Executando seed E2E..."
    Push-Location $backendRoot
    try {
        $seedOutput = python scripts/seed_e2e.py 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0 -or $seedOutput -match "Seed E2E concluído") {
            Write-Success "Seed E2E executado"
        } else {
            Write-Failure "Erro ao executar seed"
            Write-Host $seedOutput -ForegroundColor Red
            Pop-Location
            exit 1
        }
    } catch {
        Write-Failure "Erro ao executar seed: $_"
        Pop-Location
        exit 1
    }
    Pop-Location

    # 1.4. Executar auth setup (storage states)
    Write-Info "Gerando storage states de autenticação..."
    $setupOutput = npx playwright test tests/e2e/auth.setup.ts --project=chromium 2>&1 | Out-String
    if ($setupOutput -match "passed" -and $setupOutput -notmatch "failed") {
        Write-Success "Storage states gerados"
    } else {
        Write-Failure "Erro ao gerar storage states"
        Write-Host $setupOutput -ForegroundColor Red
        exit 1
    }
}

# =============================================================================
# FASE 2: EXECUTAR VALIDATION TESTS
# =============================================================================

Write-Phase "EXECUTANDO VALIDATION TESTS"

$specsToTest = @(
    "teams.welcome.spec.ts",      # Validação categoria R15
    "teams.invites.spec.ts",      # Validação duplicatas
    "teams.crud.spec.ts"          # Validação formulários
)

$totalSpecs = $specsToTest.Count
$passedSpecs = 0
$failedSpecs = 0
$failedList = @()

foreach ($spec in $specsToTest) {
    Write-Info "Executando: $spec"
    
    $specOutput = npx playwright test "tests/e2e/teams/$spec" --project=chromium 2>&1 | Out-String
    
    if ($Verbose) {
        Write-Host $specOutput -ForegroundColor Gray
    }
    
    if ($specOutput -match '(\d+) passed' -and $specOutput -notmatch '(\d+) failed') {
        Write-Success "$spec - PASSOU"
        $passedSpecs++
    } else {
        Write-Failure "$spec - FALHOU"
        $failedSpecs++
        $failedList += $spec
    }
}

# =============================================================================
# RELATÓRIO FINAL
# =============================================================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Phase "RELATÓRIO FINAL"

Write-Host "Total de specs:       $totalSpecs" -ForegroundColor White
Write-Host "Specs aprovados:      $passedSpecs" -ForegroundColor Green
Write-Host "Specs com falhas:     $failedSpecs" -ForegroundColor $(if ($failedSpecs -eq 0) { "Green" } else { "Red" })
Write-Host "Taxa de aprovação:    $(if ($totalSpecs -gt 0) { [math]::Round(($passedSpecs / $totalSpecs) * 100, 2) } else { 0 })%" -ForegroundColor White
Write-Host "Tempo de execução:    $($duration.ToString('mm\:ss'))" -ForegroundColor White

if ($failedList.Count -gt 0) {
    Write-Host ""
    Write-Host "SPECS COM FALHAS:" -ForegroundColor Red
    foreach ($spec in $failedList) {
        Write-Host "  - $spec" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "COMO DEBUGAR:" -ForegroundColor Yellow
    Write-Host "npx playwright test tests/e2e/teams/<spec> --project=chromium --workers=1 --retries=0 --debug" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host "                    VALIDAÇÕES FALHARAM" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}
else {
    Write-Host ""
    Write-Success "✅ Todas as validações passaram"
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "             VALIDAÇÕES OK - PODE PROSSEGUIR" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    exit 0
}
