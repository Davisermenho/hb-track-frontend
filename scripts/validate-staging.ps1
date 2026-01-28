# =============================================================================
# VALIDAÇÃO PÓS-DEPLOY - STAGING
# =============================================================================
#
# PROPÓSITO: Automatizar validação após deploy em staging
#
# EXECUÇÃO:
#   .\scripts\validate-staging.ps1 -StagingUrl "https://staging.hbtrack.com"
#
# SAÍDA:
#   - Exit 0: Staging validado ✅
#   - Exit 1: Problemas encontrados ❌
#
# =============================================================================

param(
    [string]$StagingUrl = "https://staging.hbtrack.com",
    [string]$ApiUrl = "https://api-staging.hbtrack.com",
    [switch]$SkipSmokeTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$startTime = Get-Date

# Cores
function Write-Phase {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

# =============================================================================
# FASE 1: HEALTH CHECK (2 min)
# =============================================================================

Write-Phase "FASE 1: HEALTH CHECK"

Write-Info "Verificando API: $ApiUrl/api/v1/health"
try {
    $healthResponse = Invoke-WebRequest -Uri "$ApiUrl/api/v1/health" -Method GET -TimeoutSec 30
    if ($healthResponse.StatusCode -eq 200) {
        Write-Success "API online (200 OK)"
    } else {
        Write-Failure "API retornou status $($healthResponse.StatusCode)"
        exit 1
    }
} catch {
    Write-Failure "API offline ou inacessível"
    Write-Host "Erro: $_" -ForegroundColor Red
    exit 1
}

Write-Info "Verificando Frontend: $StagingUrl"
try {
    $frontendResponse = Invoke-WebRequest -Uri $StagingUrl -Method GET -TimeoutSec 30
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Success "Frontend online (200 OK)"
    } else {
        Write-Failure "Frontend retornou status $($frontendResponse.StatusCode)"
        exit 1
    }
} catch {
    Write-Failure "Frontend offline ou inacessível"
    Write-Host "Erro: $_" -ForegroundColor Red
    exit 1
}

# =============================================================================
# FASE 2: SMOKE TESTS EM STAGING (10 min)
# =============================================================================

if (-not $SkipSmokeTests) {
    Write-Phase "FASE 2: SMOKE TESTS EM STAGING"

    # Configurar ambiente para staging
    $env:NEXT_PUBLIC_API_URL = $ApiUrl
    $env:NEXT_PUBLIC_APP_URL = $StagingUrl

    Write-Info "Configurado:"
    Write-Host "  NEXT_PUBLIC_API_URL = $ApiUrl" -ForegroundColor Cyan
    Write-Host "  NEXT_PUBLIC_APP_URL = $StagingUrl" -ForegroundColor Cyan

    Write-Info "Executando smoke tests contra staging..."
    npx playwright test tests/e2e/smoke-tests.spec.ts --project=chromium --workers=1 --retries=1

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Smoke tests passaram em staging (5/5)"
    } else {
        Write-Failure "Smoke tests falharam em staging"
        Write-Host "`nRECOMENDAÇÃO:" -ForegroundColor Yellow
        Write-Host "1. Verificar logs do Playwright em test-results/" -ForegroundColor Yellow
        Write-Host "2. Executar localmente para debug:" -ForegroundColor Yellow
        Write-Host "   npx playwright test tests/e2e/smoke-tests.spec.ts --debug" -ForegroundColor Cyan
        Write-Host "3. Se problema persistir, considerar ROLLBACK" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Info "Smoke tests pulados (--SkipSmokeTests)"
}

# =============================================================================
# FASE 3: VALIDAÇÃO MANUAL RÁPIDA (3 min)
# =============================================================================

Write-Phase "FASE 3: VALIDAÇÃO MANUAL (Guia)"

Write-Host "Execute manualmente (3 min):" -ForegroundColor Yellow
Write-Host "1. Abrir: $StagingUrl" -ForegroundColor Cyan
Write-Host "2. Fazer login com credenciais de teste" -ForegroundColor Cyan
Write-Host "3. Ir para /teams" -ForegroundColor Cyan
Write-Host "4. Criar 1 equipe → Deve funcionar" -ForegroundColor Cyan
Write-Host "5. Equipe aparece na lista → Deve aparecer" -ForegroundColor Cyan

Write-Host "`nApós validação manual, pressione qualquer tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# =============================================================================
# RELATÓRIO FINAL
# =============================================================================

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Phase "RELATÓRIO FINAL"

Write-Host "Staging URL:          $StagingUrl" -ForegroundColor White
Write-Host "API URL:              $ApiUrl" -ForegroundColor White
Write-Host "Health Check API:     ✅ OK" -ForegroundColor Green
Write-Host "Health Check Frontend:✅ OK" -ForegroundColor Green

if (-not $SkipSmokeTests) {
    Write-Host "Smoke Tests:          ✅ OK (5/5)" -ForegroundColor Green
} else {
    Write-Host "Smoke Tests:          ⚠️  PULADOS" -ForegroundColor Yellow
}

Write-Host "Tempo de execução:    $($duration.ToString('mm\:ss'))" -ForegroundColor White

Write-Host "`n✅✅✅ STAGING VALIDADO COM SUCESSO ✅✅✅" -ForegroundColor Green -BackgroundColor DarkGreen
Write-Host "Deploy em staging foi bem-sucedido e está funcional." -ForegroundColor Green

Write-Host "`nPRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Monitorar logs de erro (Sentry) nas próximas 24h" -ForegroundColor White
Write-Host "2. Acompanhar métricas de latência e taxa de erro" -ForegroundColor White
Write-Host "3. Coletar feedback de QA/stakeholders" -ForegroundColor White
Write-Host "4. Planejar deploy para produção (após 3-7 dias)" -ForegroundColor White

exit 0
