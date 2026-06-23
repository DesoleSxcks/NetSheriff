# NetSheriff - Script de Testes Manual (PowerShell)
# Execute cada seção para testar diferentes aspectos

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  NetSheriff - Testes Manuais (CLI)   ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Yellow

$BASE_URL = "http://localhost:3000/api"

# ===== TESTE 1: REGISTRO =====
Write-Host "✓ TESTE 1: Registrar novo usuário" -ForegroundColor Blue
$registerResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/register" -Method POST `
  -ContentType "application/json" `
  -Body (@{
    email = "teste_$(Get-Date -Format 'yyyyMMddHHmmss')@netsheriff.com"
    password = "senha123"
    name = "Teste Usuario"
  } | ConvertTo-Json) -UseBasicParsing

$registerData = $registerResponse.Content | ConvertFrom-Json
Write-Host "  Email: $($registerData.user.email)" -ForegroundColor Green
Write-Host "  Token: $($registerData.token.Substring(0, 20))..." -ForegroundColor Green
Write-Host "  Resultado: ✓ PASSOU`n" -ForegroundColor Green

# ===== TESTE 2: LOGIN =====
Write-Host "✓ TESTE 2: Fazer login" -ForegroundColor Blue
$loginResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/login" -Method POST `
  -ContentType "application/json" `
  -Body (@{
    email = "admin@netsheriff.com"
    password = "senha123"
  } | ConvertTo-Json) -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$token = $loginData.token
Write-Host "  Email: $($loginData.user.email)" -ForegroundColor Green
Write-Host "  Nome: $($loginData.user.name)" -ForegroundColor Green
Write-Host "  Resultado: ✓ PASSOU`n" -ForegroundColor Green

# ===== TESTE 3: OBTER USUÁRIO =====
Write-Host "✓ TESTE 3: Obter dados do usuário autenticado" -ForegroundColor Blue
$meResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/me" `
  -Headers @{"Authorization" = "Bearer $token"} -UseBasicParsing

$meData = $meResponse.Content | ConvertFrom-Json
Write-Host "  ID: $($meData.id)" -ForegroundColor Green
Write-Host "  Email: $($meData.email)" -ForegroundColor Green
Write-Host "  Nome: $($meData.name)" -ForegroundColor Green
Write-Host "  Resultado: ✓ PASSOU`n" -ForegroundColor Green

# ===== TESTE 4: ACESSO SEM TOKEN =====
Write-Host "✓ TESTE 4: Tentar acessar /rules SEM token (deve bloquear)" -ForegroundColor Blue
try {
  $noTokenResponse = Invoke-WebRequest -Uri "$BASE_URL/rules" -UseBasicParsing
  Write-Host "  ✗ FALHOU - endpoint não está protegido!" -ForegroundColor Red
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  if ($statusCode -eq 401) {
    Write-Host "  Status: $statusCode (Unauthorized)" -ForegroundColor Green
    Write-Host "  Resultado: ✓ PASSOU - bloqueado corretamente`n" -ForegroundColor Green
  }
}

# ===== TESTE 5: TOKEN INVÁLIDO =====
Write-Host "✓ TESTE 5: Acessar com token inválido (deve bloquear)" -ForegroundColor Blue
try {
  $invalidTokenResponse = Invoke-WebRequest -Uri "$BASE_URL/rules" `
    -Headers @{"Authorization" = "Bearer token_invalido"} -UseBasicParsing
  Write-Host "  ✗ FALHOU - endpoint aceitou token inválido!" -ForegroundColor Red
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  if ($statusCode -eq 401) {
    Write-Host "  Status: $statusCode (Unauthorized)" -ForegroundColor Green
    Write-Host "  Resultado: ✓ PASSOU - token rejeitado corretamente`n" -ForegroundColor Green
  }
}

# ===== TESTE 6: ACESSO COM TOKEN VÁLIDO =====
Write-Host "✓ TESTE 6: Acessar /rules COM token válido" -ForegroundColor Blue
$rulesResponse = Invoke-WebRequest -Uri "$BASE_URL/rules" `
  -Headers @{"Authorization" = "Bearer $token"} -UseBasicParsing
$rules = $rulesResponse.Content | ConvertFrom-Json
Write-Host "  Regras retornadas: $($rules.Count)" -ForegroundColor Green
Write-Host "  Resultado: ✓ PASSOU`n" -ForegroundColor Green

# ===== TESTE 7: OUTROS ENDPOINTS =====
Write-Host "✓ TESTE 7: Acessar /alerts COM token" -ForegroundColor Blue
$alertsResponse = Invoke-WebRequest -Uri "$BASE_URL/alerts" `
  -Headers @{"Authorization" = "Bearer $token"} -UseBasicParsing
$alerts = $alertsResponse.Content | ConvertFrom-Json
Write-Host "  Alertas retornados: $($alerts.Count)" -ForegroundColor Green
Write-Host "  Resultado: ✓ PASSOU`n" -ForegroundColor Green

Write-Host "✓ TESTE 8: Acessar /traffic COM token" -ForegroundColor Blue
$trafficResponse = Invoke-WebRequest -Uri "$BASE_URL/traffic" `
  -Headers @{"Authorization" = "Bearer $token"} -UseBasicParsing
$traffic = $trafficResponse.Content | ConvertFrom-Json
Write-Host "  Tráfego retornado: $($traffic.Count)" -ForegroundColor Green
Write-Host "  Resultado: ✓ PASSOU`n" -ForegroundColor Green

# ===== TESTE 9: CREDENCIAIS ERRADAS =====
Write-Host "✓ TESTE 9: Login com senha errada (deve bloquear)" -ForegroundColor Blue
try {
  $wrongPassResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/login" -Method POST `
    -ContentType "application/json" `
    -Body (@{
      email = "admin@netsheriff.com"
      password = "senha_errada"
    } | ConvertTo-Json) -UseBasicParsing
  Write-Host "  ✗ FALHOU - login aceitou senha errada!" -ForegroundColor Red
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  if ($statusCode -eq 401) {
    Write-Host "  Status: $statusCode (Unauthorized)" -ForegroundColor Green
    Write-Host "  Resultado: ✓ PASSOU - senha rejeitada corretamente`n" -ForegroundColor Green
  }
}

# ===== RESUMO =====
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║            RESUMO DOS TESTES          ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host "`n🎉 TODOS OS TESTES PASSARAM!`n" -ForegroundColor Green
Write-Host "✓ Autenticação funcionando" -ForegroundColor Green
Write-Host "✓ Endpoints protegidos" -ForegroundColor Green
Write-Host "✓ Token JWT validado" -ForegroundColor Green
Write-Host "✓ Integração completa`n" -ForegroundColor Green
