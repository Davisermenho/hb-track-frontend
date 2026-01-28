# =============================================================================
# SCRIPT DE VALIDAÇÃO COMPLETA - TEAMS MODULE
# =============================================================================
#
# PROPÓSITO: Executar toda a suite de testes E2E na ordem canônica.
#
# ORDEM: GATE → SETUP → CONTRATO → FUNCIONAIS
#
# EXECUÇÃO:
#   .\tests\e2e\run-teams-suite.ps1
#
# SAÍDA:
#   - Exit 0: Todos os testes passaram ✅
#   - Exit 1: Algum teste falhou ❌
#
# =============================================================================

param(
    [switch]$SkipGate = $false,
    [switch]$SkipSetup = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = 'Continue'
$startTime = Get-Date

# Garantir que estamos no diretório correto do projeto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
Set-Location $projectRoot

Write-Host "Diretorio do projeto: $projectRoot" -ForegroundColor Cyan
Write-Host "Verificando instalacao do Playwright..." -ForegroundColor Cyan

# Cores
function Write-Phase {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

# Contadores
$totalTests = 0
$passedTests = 0
$failedTests = 0
$failedSpecs = @()

# =============================================================================
# FASE 1: GATE (Infraestrutura)
# =============================================================================

if (-not $SkipGate) {
    Write-Phase "FASE 1: GATE (Infraestrutura)"

    Write-Info "Executando: health.gate.spec.ts"
    $output = npx playwright test tests/e2e/health.gate.spec.ts --project=chromium --workers=1 --retries=0 2>&1 | Out-String
    Write-Host $output

    # Verificar se os testes passaram (ignorar erro do Node.js no Windows)
    if ($output -match '(\d+) passed' -and $output -notmatch '(\d+) failed') {
        Write-Success "GATE passou - App/API online"
        $passedTests++
    } else {
        Write-Failure "GATE falhou - App/API offline ou com problemas"
        Write-Host "`nRECOMENDACOES:" -ForegroundColor Yellow
        Write-Host "1. Verifique se a API esta rodando: curl http://localhost:8000/api/v1/health" -ForegroundColor Yellow
        Write-Host "2. Verifique se o Frontend esta rodando: curl http://localhost:3000" -ForegroundColor Yellow
        Write-Host "3. Verifique logs da API/Frontend" -ForegroundColor Yellow
        $failedTests++
        $failedSpecs += "health.gate.spec.ts"
        exit 1
    }
    $totalTests++
} else {
    Write-Info "GATE pulado (-SkipGate)"
}

# =============================================================================
# FASE 2: SETUP (Autenticação)
# =============================================================================

if (-not $SkipSetup) {
    Write-Phase "FASE 2: SETUP (Autenticação)"

    Write-Info "Executando: setup/auth.setup.ts"
    $output = npx playwright test tests/e2e/setup/auth.setup.ts --project=setup --workers=1 --retries=0 2>&1 | Out-String
    Write-Host $output

    # Verificar se os testes passaram (ignorar erro do Node.js no Windows)
    if ($output -match '(\d+) passed' -and $output -notmatch '(\d+) failed') {
        Write-Success "SETUP passou - storageState gerado para todos os roles"
        $passedTests++
    } else {
        Write-Failure "SETUP falhou - Problema na autenticacao"
        Write-Host "`nRECOMENDACOES:" -ForegroundColor Yellow
        Write-Host "1. Verifique credenciais em .env.test (TEST_ADMIN_EMAIL e TEST_ADMIN_PASSWORD)" -ForegroundColor Yellow
        Write-Host "2. Verifique se usuarios E2E existem no banco de dados" -ForegroundColor Yellow
        Write-Host "3. Rode seed E2E: npm run db:seed:e2e" -ForegroundColor Yellow
        $failedTests++
        $failedSpecs += "setup/auth.setup.ts"
        exit 1
    }
    $totalTests++
} else {
    Write-Info "SETUP pulado (-SkipSetup)"
}

# =============================================================================
# FASE 3: CONTRATO (Navegação/Erros)
# =============================================================================

Write-Phase "FASE 3: CONTRATO (Navegação/Erros)"

Write-Info "Executando: teams/teams.contract.spec.ts"
$output = npx playwright test tests/e2e/teams/teams.contract.spec.ts --project=chromium --workers=1 --retries=0 2>&1 | Out-String
Write-Host $output

# Verificar se os testes passaram (ignorar erro do Node.js no Windows)
if ($output -match '(\d+) passed' -and $output -notmatch '(\d+) failed') {
    Write-Success "CONTRATO passou - Navegacao/Redirects/404 funcionando"
    $passedTests++
} else {
    Write-Failure "CONTRATO falhou - Problemas em navegacao/erros"
    Write-Host "`nRECOMENDACOES:" -ForegroundColor Yellow
    Write-Host "1. Verifique middleware de autenticacao" -ForegroundColor Yellow
    Write-Host "2. Verifique redirects canonicos (/teams/:id -> /teams/:id/overview)" -ForegroundColor Yellow
    Write-Host "3. Verifique paginas 404" -ForegroundColor Yellow
    $failedTests++
    $failedSpecs += "teams.contract.spec.ts"
    exit 1
}
$totalTests++

# =============================================================================
# FASE 4: FUNCIONAIS (Features)
# =============================================================================

Write-Phase "FASE 4: FUNCIONAIS (Features)"

$functionalSpecs = @(
    "teams.auth.spec.ts",
    "teams.crud.spec.ts",
    "teams.states.spec.ts",
    "teams.rbac.spec.ts",
    "teams.welcome.spec.ts",
    "teams.routing.spec.ts",
    "teams.invites.spec.ts",
    "teams.trainings.spec.ts",
    "teams.stats.spec.ts",
    "teams.athletes.spec.ts"
)

foreach ($spec in $functionalSpecs) {
    Write-Info "Executando: teams/$spec"
    $totalTests++

    $output = npx playwright test "tests/e2e/teams/$spec" --project=chromium --workers=1 --retries=0 2>&1 | Out-String
    Write-Host $output

    # Verificar se os testes passaram (ignorar erro do Node.js no Windows)
    if ($output -match '(\d+) passed' -and $output -notmatch '(\d+) failed') {
        Write-Success "$spec passou"
        $passedTests++
    } else {
        Write-Failure "$spec falhou"
        $failedTests++
        $failedSpecs += $spec
        # Continuar executando outros specs (não abortar)
    }
}

# =============================================================================
# RELATÓRIO FINAL
# =============================================================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Phase "RELATORIO FINAL"

Write-Host "Total de specs:       $totalTests" -ForegroundColor White
Write-Host "Specs aprovados:      $passedTests" -ForegroundColor Green
Write-Host "Specs com falhas:     $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "Tempo de execucao:    $($duration.ToString('mm\:ss'))" -ForegroundColor White

if ($failedSpecs.Count -gt 0) {
    Write-Host "`nSPECS COM FALHAS:" -ForegroundColor Red
    foreach ($spec in $failedSpecs) {
        Write-Host "  [X] $spec" -ForegroundColor Red
    }

    Write-Host "`nRECOMENDACOES GERAIS:" -ForegroundColor Yellow
    Write-Host "1. Rode o spec com falha individualmente para debug:" -ForegroundColor Yellow
    Write-Host "   npx playwright test tests/e2e/teams/<spec> --project=chromium --workers=1 --retries=0 --debug" -ForegroundColor Cyan
    Write-Host "2. Verifique logs em tests_log/" -ForegroundColor Yellow
    Write-Host "3. Verifique screenshots/videos em test-results/" -ForegroundColor Yellow

    Write-Host "`n[FALHA] SUITE FALHOU - NAO LIBERAR PARA STAGING" -ForegroundColor Red -BackgroundColor DarkRed
    exit 1
} else {
    Write-Host "`n[OK] TODOS OS TESTES PASSARAM!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "[OK] MODULO TEAMS VALIDADO - PRONTO PARA STAGING!" -ForegroundColor Green -BackgroundColor DarkGreen
    exit 0
}
