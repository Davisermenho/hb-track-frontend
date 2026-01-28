# =============================================================================
# PIPELINE E2E COMPLETO - TEAMS MODULE
# =============================================================================
#
# PROPOSITO: Script Ãºnico que executa todo o pipeline E2E do mÃ³dulo Teams
#
# PIPELINE:
#   1. VALIDAÃ‡ÃƒO   - Verifica prÃ©-requisitos (API, Frontend, Node.js, Playwright)
#   2. DATABASE    - Reset + Migration + Seed E2E
#   3. GATE        - Testes de infraestrutura (health.gate.spec.ts)
#   4. SETUP       - Gera storage states de autenticaÃ§Ã£o (auth.setup.ts)
#   5. CONTRATO    - Testes de navegaÃ§Ã£o/erros (teams.contract.spec.ts)
#   6. FUNCIONAIS  - 10 specs de features (CRUD, RBAC, States, etc)
#
# EXECUÃ‡ÃƒO:
#   # Pipeline completo
#   .\tests\e2e\run-e2e-teams.ps1
#
#   # Pular validaÃ§Ã£o (ambiente jÃ¡ validado)
#   .\tests\e2e\run-e2e-teams.ps1 -SkipValidation
#
#   # Pular database (seed jÃ¡ rodou)
#   .\tests\e2e\run-e2e-teams.ps1 -SkipDatabase
#
#   # Pular GATE (infraestrutura jÃ¡ validada)
#   .\tests\e2e\run-e2e-teams.ps1 -SkipGate
#
#   # Apenas seed (preparar DB sem rodar testes)
#   .\tests\e2e\run-e2e-teams.ps1 -SeedOnly
#
#   # Debug verbose
#   .\tests\e2e\run-e2e-teams.ps1 -Verbose
#
# SAÃDA:
#   - Exit 0: Todos os testes passaram
#   - Exit 1: Alguma fase falhou
#
# =============================================================================

param(
    [switch]$SkipValidation = $false,
    [switch]$SkipDatabase = $false,
    [switch]$SkipGate = $false,
    [switch]$SkipSetup = $false,
    [switch]$SeedOnly = $false,
    [switch]$Verbose = $false,
    [string]$Spec = "",
    [switch]$Watch = $false
)

$ErrorActionPreference = 'Continue'
$pipelineStartTime = Get-Date

# Garantir que estamos no diretÃ³rio correto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)
$backendRoot = Join-Path (Split-Path -Parent $frontendRoot) "Hb Track - Backend"

Set-Location $frontendRoot

# =============================================================================
# FUNÃ‡Ã•ES AUXILIARES
# =============================================================================

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

function Write-Phase {
    param([string]$Message, [int]$Number = 0)
    Write-Host ""
    if ($Number -gt 0) {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "FASE $Number : $Message" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
    } else {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "$Message" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
    }
    Write-Host ""
}

function Test-PlaywrightOutput {
    param([string]$Output)
    # Ignora o bug do Node.js no Windows (exit code != 0)
    # Verifica se tem "X passed" e NÃƒO tem "X failed"
    return ($Output -match '(\d+) passed' -and $Output -notmatch '(\d+) failed')
}

# Contadores globais
$totalSpecs = 0
$passedSpecs = 0
$failedSpecs = 0
$failedSpecsList = @()

# =============================================================================
# CABEÃ‡ALHO
# =============================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "          PIPELINE E2E COMPLETO - TEAMS MODULE" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Cyan
Write-Host " Validacao -> Database -> Gate -> Setup -> Contrato -> Funcionais" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Info "DiretÃ³rio Frontend: $frontendRoot"
Write-Info "DiretÃ³rio Backend:  $backendRoot"

# =============================================================================
# FASE 1: VALIDAÃ‡ÃƒO DE AMBIENTE
# =============================================================================

if (-not $SkipValidation) {
    Write-Phase "VALIDAÃ‡ÃƒO DE AMBIENTE" 1

    $validationFailed = $false

    # 1.1. Node.js instalado
    Write-Info "Verificando Node.js..."
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js $nodeVersion"
    } else {
        Write-Failure "Node.js nÃ£o encontrado"
        $validationFailed = $true
    }

    # 1.2. Playwright instalado
    Write-Info "Verificando Playwright..."
    $playwrightVersion = npx playwright --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Playwright $playwrightVersion"
    } else {
        Write-Failure "Playwright nÃ£o instalado"
        Write-Host "   Execute: npm install" -ForegroundColor Yellow
        $validationFailed = $true
    }

    # 1.3. API Backend rodando
    Write-Info "Verificando API Backend (localhost:8000)..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" `
                                      -Method GET `
                                      -TimeoutSec 5 `
                                      -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "API Backend online"
        } else {
            Write-Failure "API Backend respondeu com status $($response.StatusCode)"
            $validationFailed = $true
        }
    } catch {
        Write-Failure "API Backend nÃ£o respondendo"
        Write-Host "   Inicie com: cd '$backendRoot' ; python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Yellow
        $validationFailed = $true
    }

    # 1.4. Frontend rodando
    Write-Info "Verificando Frontend (localhost:3000)..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" `
                                      -Method GET `
                                      -TimeoutSec 5 `
                                      -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend online"
        } else {
            Write-Failure "Frontend respondeu com status $($response.StatusCode)"
            $validationFailed = $true
        }
    } catch {
        Write-Failure "Frontend nÃ£o respondendo"
        Write-Host "   Inicie com: cd '$frontendRoot' ; npm run dev" -ForegroundColor Yellow
        $validationFailed = $true
    }

    # 1.5. playwright.config.ts existe
    Write-Info "Verificando playwright.config.ts..."
    if (Test-Path ".\playwright.config.ts") {
        Write-Success "playwright.config.ts encontrado"
    } else {
        Write-Failure "playwright.config.ts nÃ£o encontrado"
        $validationFailed = $true
    }

    if ($validationFailed) {
        Write-Failure "ValidaÃ§Ã£o falhou - corrija os problemas acima"
        exit 1
    }

    Write-Success "Ambiente validado com sucesso"
} else {
    Write-Info "FASE 1 pulada (-SkipValidation)"
}

# =============================================================================
# FASE 2: DATABASE (Reset + Migration + Seed)
# =============================================================================

if (-not $SkipDatabase) {
    Write-Phase "DATABASE - Reset + Migration + Seed E2E" 2

    Write-Info "Rodando reset-db-e2e.ps1..."

    $resetScript = Join-Path $backendRoot "reset-db-e2e.ps1"

    if (Test-Path $resetScript) {
        Push-Location $backendRoot
        $output = & $resetScript 2>&1 | Out-String
        Pop-Location

        Write-Host $output

        if ($LASTEXITCODE -eq 0 -or $output -match 'Seed E2E completo') {
            Write-Success "Database preparado com sucesso"
        } else {
            Write-Failure "Reset database falhou"
            Write-Host "Dicas:" -ForegroundColor Yellow
            Write-Host "1. Verifique se Docker estÃ¡ rodando" -ForegroundColor Yellow
            Write-Host "2. Verifique logs: docker-compose logs postgres" -ForegroundColor Yellow
            Write-Host "3. Tente manual: cd '$backendRoot' ; .\reset-db-e2e.ps1" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Failure "Script reset-db-e2e.ps1 nÃ£o encontrado em: $resetScript"
        exit 1
    }
} else {
    Write-Info "FASE 2 pulada (-SkipDatabase)"
}

# Se -SeedOnly, parar aqui
if ($SeedOnly) {
    $pipelineEndTime = Get-Date
    $duration = $pipelineEndTime - $pipelineStartTime

    Write-Phase "CONCLUÃDO"
    Write-Host "Tempo total: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "                    SEED COMPLETO!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "  Banco de dados E2E preparado com sucesso." -ForegroundColor Green
    Write-Host "  Pronto para execucao de testes." -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    exit 0
}

# =============================================================================
# FASE 3: GATE (Infraestrutura)
# =============================================================================

if (-not $SkipGate) {
    Write-Phase "GATE - Testes de Infraestrutura" 3

    Write-Info "Executando: health.gate.spec.ts"
    $totalSpecs++

    $output = npx playwright test tests/e2e/health.gate.spec.ts --project=chromium --workers=1 --retries=0 2>&1 | Out-String
    Write-Host $output

    if (Test-PlaywrightOutput -Output $output) {
        Write-Success "GATE passou - App/API online"
        $passedSpecs++
    } else {
        Write-Failure "GATE falhou - App/API offline ou com problemas"
        Write-Host "RECOMENDACOES:" -ForegroundColor Yellow
        Write-Host "1. curl http://localhost:8000/api/v1/health" -ForegroundColor Yellow
        Write-Host "2. curl http://localhost:3000" -ForegroundColor Yellow
        Write-Host "3. Verifique logs da API/Frontend" -ForegroundColor Yellow
        $failedSpecs++
        $failedSpecsList += "health.gate.spec.ts"
        exit 1
    }
} else {
    Write-Info "FASE 3 pulada (-SkipGate)"
}

# =============================================================================
# FASE 4: SETUP (AutenticaÃ§Ã£o)
# =============================================================================

if (-not $SkipSetup) {
    Write-Phase "SETUP - GeraÃ§Ã£o de Storage States" 4

    Write-Info "Executando: setup/auth.setup.ts"
    Write-Info "Isto pode levar 30-60 segundos..."
    $totalSpecs++

    $output = npx playwright test tests/e2e/setup/auth.setup.ts --project=setup --workers=1 --retries=0 2>&1 | Out-String
    Write-Host $output

    if (Test-PlaywrightOutput -Output $output) {
        Write-Success "SETUP passou - storageState gerado para todos os roles"
        $passedSpecs++
    } else {
        Write-Failure "SETUP falhou - Problema na autenticaÃ§Ã£o"
        Write-Host "RECOMENDACOES:" -ForegroundColor Yellow
        Write-Host "1. Verifique credenciais em .env.test" -ForegroundColor Yellow
        Write-Host "2. Verifique se usuÃ¡rios E2E existem no banco" -ForegroundColor Yellow
        Write-Host "3. Rode seed E2E novamente" -ForegroundColor Yellow
        $failedSpecs++
        $failedSpecsList += "setup/auth.setup.ts"
        exit 1
    }
} else {
    Write-Info "FASE 4 pulada (-SkipSetup)"
}

# =============================================================================
# FASE 5: CONTRATO (NavegaÃ§Ã£o/Erros)
# =============================================================================

Write-Phase "CONTRATO - NavegaÃ§Ã£o e Tratamento de Erros" 5

Write-Info "Executando: teams/teams.contract.spec.ts"
$totalSpecs++

$output = npx playwright test tests/e2e/teams/teams.contract.spec.ts --project=chromium --workers=1 --retries=0 2>&1 | Out-String
Write-Host $output

if (Test-PlaywrightOutput -Output $output) {
    Write-Success "CONTRATO passou - NavegaÃ§Ã£o/Redirects/404 funcionando"
    $passedSpecs++
} else {
    Write-Failure "CONTRATO falhou - Problemas em navegaÃ§Ã£o/erros"
    Write-Host "RECOMENDACOES:" -ForegroundColor Yellow
    Write-Host "1. Verifique middleware de autenticaÃ§Ã£o" -ForegroundColor Yellow
    Write-Host "2. Verifique redirects canÃ´nicos (/teams/:id -> /teams/:id/overview)" -ForegroundColor Yellow
    Write-Host "3. Verifique pÃ¡ginas 404" -ForegroundColor Yellow
    $failedSpecs++
    $failedSpecsList += "teams.contract.spec.ts"
    exit 1
}

# =============================================================================
# FASE 6: FUNCIONAIS (Features)
# =============================================================================

Write-Phase "FUNCIONAIS - Features do MÃ³dulo Teams" 6

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

Write-Info "Executando $($functionalSpecs.Count) specs funcionais..."
Write-Info "Isto pode levar 5-10 minutos..."

foreach ($spec in $functionalSpecs) {
    Write-Info "Executando: teams/$spec"
    $totalSpecs++

    $output = npx playwright test "tests/e2e/teams/$spec" --project=chromium --workers=1 --retries=0 2>&1 | Out-String

    if ($Verbose) {
        Write-Host $output
    } else {
        # Mostrar apenas resumo se nÃ£o for verbose
        $summary = $output | Select-String -Pattern "(\d+) passed|(\d+) failed"
        Write-Host $summary
    }

    if (Test-PlaywrightOutput -Output $output) {
        Write-Success "$spec passou"
        $passedSpecs++
    } else {
        Write-Failure "$spec falhou"
        $failedSpecs++
        $failedSpecsList += $spec
        # NÃ£o abortar - continuar executando outros specs
    }
}

# =============================================================================
# RELATÃ“RIO FINAL
# =============================================================================

$pipelineEndTime = Get-Date
$duration = $pipelineEndTime - $pipelineStartTime

Write-Phase "RELATORIO FINAL"

Write-Host "Total de specs:       $totalSpecs" -ForegroundColor White
Write-Host "Specs aprovados:      $passedSpecs" -ForegroundColor Green
Write-Host "Specs com falhas:     $failedSpecs" -ForegroundColor $(if ($failedSpecs -eq 0) { "Green" } else { "Red" })
Write-Host "Taxa de aprovacao:    $(if ($totalSpecs -gt 0) { [math]::Round(($passedSpecs / $totalSpecs) * 100, 2) } else { 0 })%" -ForegroundColor White
Write-Host "Tempo de execucao:    $($duration.ToString('mm\:ss'))" -ForegroundColor White

if ($failedSpecsList.Count -gt 0) {
    Write-Host ""
    Write-Host "SPECS COM FALHAS:" -ForegroundColor Red
    foreach ($spec in $failedSpecsList) {
        Write-Host "  - $spec" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "RECOMENDACOES GERAIS:" -ForegroundColor Yellow
    Write-Host "1. Rode o spec com falha individualmente para debug:" -ForegroundColor Yellow
    Write-Host "   npx playwright test tests/e2e/teams/<spec> --project=chromium --workers=1 --retries=0 --debug" -ForegroundColor Cyan
    Write-Host "2. Verifique logs em tests/e2e/tests_log/" -ForegroundColor Yellow
    Write-Host "3. Verifique screenshots/videos em test-results/" -ForegroundColor Yellow

    Write-Host ""
    $failBorder = "=" * 64
    Write-Host $failBorder -ForegroundColor Red
    Write-Host "                          FALHA" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "  Pipeline E2E falhou - NAO LIBERAR PARA STAGING" -ForegroundColor Red
    Write-Host $failBorder -ForegroundColor Red
    Write-Host ""
    exit 1
}
else {
    Write-Host ""
    Write-Success "Todos os testes passaram"
    Write-Host ""
    exit 0
}

