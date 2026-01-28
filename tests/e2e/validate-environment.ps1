# =============================================================================
# SCRIPT DE VALIDACAO DE AMBIENTE - TESTES E2E
# =============================================================================
#
# PROPOSITO: Validar pré-requisitos antes de rodar testes Playwright
#
# CHECKLIST:
#   ✓ API Backend rodando em localhost:8000
#   ✓ Frontend rodando em localhost:3000
#   ✓ Playwright instalado
#   ✓ Node.js instalado
#   ✓ Arquivo .env.test existe
#   ✓ Banco de dados E2E acessível
#
# EXECUCAO:
#   .\tests\e2e\validate-environment.ps1
#
# SAIDA:
#   - Exit 0: Ambiente validado, pronto para testes
#   - Exit 1: Algo está errado, não execute testes ainda
#
# =============================================================================

param(
    [switch]$Verbose = $false,
    [switch]$Quick = $false
)

$ErrorActionPreference = 'Continue'
$failureCount = 0

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
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "$Message" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

# =============================================================================
# VALIDACOES
# =============================================================================

Write-Section "VALIDACAO DE AMBIENTE - TESTES E2E"

# 1. Node.js instalado
Write-Info "1. Verificando Node.js..."
$nodeVersion = npm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "npm versao: $nodeVersion"
} else {
    Write-Failure "npm nao encontrado em PATH"
    Write-Host "   Instale Node.js 16+ em: https://nodejs.org/" -ForegroundColor Yellow
    $failureCount++
}

# 2. Playwright instalado
Write-Info "2. Verificando Playwright..."
$playwrightVersion = npx playwright --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Playwright $playwrightVersion"
} else {
    Write-Failure "Playwright nao instalado"
    Write-Host "   Execute: npm install" -ForegroundColor Yellow
    $failureCount++
}

# 3. Arquivo .env.test existe
Write-Info "3. Verificando .env.test..."
$envTestPath = ".\.env.test"
if (Test-Path $envTestPath) {
    Write-Success ".env.test encontrado"
} else {
    Write-Failure ".env.test nao encontrado em: $(Get-Location)"
    Write-Host "   Crie o arquivo ou copie de .env.example" -ForegroundColor Yellow
    $failureCount++
}

# 4. API Backend rodando
Write-Info "4. Verificando API Backend (localhost:8000)..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" `
                                  -Method GET `
                                  -TimeoutSec 5 `
                                  -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Success "API Backend online"
        if ($Verbose) {
            Write-Host "   Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Compress)" -ForegroundColor Gray
        }
    } else {
        Write-Failure "API Backend respondeu com status $($response.StatusCode)"
        $failureCount++
    }
} catch {
    Write-Failure "API Backend nao respondendo (http://localhost:8000/api/v1/health)"
    Write-Host "   Inicie o backend com: npm run dev (ou python -m uvicorn...)" -ForegroundColor Yellow
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    $failureCount++
}

# 5. Frontend rodando
Write-Info "5. Verificando Frontend (localhost:3000)..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" `
                                  -Method GET `
                                  -TimeoutSec 5 `
                                  -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Success "Frontend online"
    } else {
        Write-Failure "Frontend respondeu com status $($response.StatusCode)"
        $failureCount++
    }
} catch {
    Write-Failure "Frontend nao respondendo (http://localhost:3000)"
    Write-Host "   Inicie o frontend com: npm run dev" -ForegroundColor Yellow
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    $failureCount++
}

# 6. Banco de dados (skip com -Quick)
if (-not $Quick) {
    Write-Info "6. Verificando Banco de Dados..."
    try {
        # Fazer uma chamada à API que usa o banco
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/teams" `
                                      -Method GET `
                                      -TimeoutSec 5 `
                                      -UseBasicParsing `
                                      -Headers @{ "Authorization" = "Bearer test" }
        # Mesmo se retornar 401, significa que o DB está acessível
        if ($response.StatusCode -in @(200, 401, 403, 404)) {
            Write-Success "Banco de Dados acessível"
        } else {
            Write-Warning "Banco de Dados retornou status inesperado: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "Nao conseguiu validar Banco de Dados completamente"
        Write-Host "   Verifique se PostgreSQL está rodando" -ForegroundColor Yellow
        # Nao incrementa failureCount pois API já foi validada
    }
}

# 7. Playwright config
Write-Info "7. Verificando playwright.config.ts..."
if (Test-Path ".\playwright.config.ts") {
    Write-Success "playwright.config.ts encontrado"
} else {
    Write-Failure "playwright.config.ts nao encontrado"
    $failureCount++
}

# =============================================================================
# RESUMO FINAL
# =============================================================================

Write-Section "RESUMO"

if ($failureCount -eq 0) {
    Write-Success "Ambiente validado com sucesso!"
    Write-Host "`nVoce pode executar:" -ForegroundColor Green
    Write-Host "  .\tests\e2e\run-teams-suite.ps1" -ForegroundColor Green
    Write-Host "`nOu rodar testes especificos:" -ForegroundColor Green
    Write-Host "  npx playwright test tests/e2e/health.gate.spec.ts --project=chromium" -ForegroundColor Green
    exit 0
} else {
    Write-Failure "Ambiente NAO validado ($failureCount problema(s) encontrado(s))"
    Write-Host "`nResolva os problemas acima e execute novamente:" -ForegroundColor Yellow
    Write-Host "  .\tests\e2e\validate-environment.ps1" -ForegroundColor Yellow
    exit 1
}
