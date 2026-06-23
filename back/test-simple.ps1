# NetSheriff - Script de Testes Simples
# Teste cada uma das requisições abaixo

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  NetSheriff - Testes de API           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

$BASE_URL = "http://localhost:3000/api"

# ===== TESTE 1: REGISTRAR =====
Write-Host "📝 TESTE 1: Registrar novo usuário" -ForegroundColor Yellow
$email = "teste_$(Get-Random)@netsheriff.com"
$body = @{
    email = $email
    password = "senha123"
    name = "Usuario Teste"
} | ConvertTo-Json

try {
    $r1 = Invoke-WebRequest -Uri "$BASE_URL/auth/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    $data = $r1.Content | ConvertFrom-Json
    $global:token = $data.token
    Write-Host "   ✓ Sucesso! Token gerado" -ForegroundColor Green
    Write-Host "   Email: $($data.user.email)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Falha: $($_)" -ForegroundColor Red
}

# ===== TESTE 2: LOGIN =====
Write-Host "`n🔑 TESTE 2: Fazer login" -ForegroundColor Yellow
$body = @{
    email = "admin@netsheriff.com"
    password = "senha123"
} | ConvertTo-Json

try {
    $r2 = Invoke-WebRequest -Uri "$BASE_URL/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    $data = $r2.Content | ConvertFrom-Json
    $global:token = $data.token
    Write-Host "   ✓ Sucesso! Login realizado" -ForegroundColor Green
    Write-Host "   Email: $($data.user.email)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Falha: $($_)" -ForegroundColor Red
}

# ===== TESTE 3: OBTER USUÁRIO =====
Write-Host "`n👤 TESTE 3: Obter dados do usuário (com token)" -ForegroundColor Yellow
try {
    $r3 = Invoke-WebRequest -Uri "$BASE_URL/auth/me" -Headers @{"Authorization"="Bearer $global:token"} -UseBasicParsing
    $data = $r3.Content | ConvertFrom-Json
    Write-Host "   ✓ Sucesso!" -ForegroundColor Green
    Write-Host "   Nome: $($data.name)" -ForegroundColor Green
    Write-Host "   Email: $($data.email)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Falha: $($_)" -ForegroundColor Red
}

# ===== TESTE 4: SEM TOKEN (DEVE BLOQUEAR) =====
Write-Host "`n🚫 TESTE 4: Acessar /rules SEM token (deve bloquear)" -ForegroundColor Yellow
try {
    $r4 = Invoke-WebRequest -Uri "$BASE_URL/rules" -UseBasicParsing
    Write-Host "   ✗ Falha: Endpoint não está protegido!" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.Value__
    if ($code -eq 401) {
        Write-Host "   ✓ Correto! Bloqueado com status 401" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Status inesperado: $code" -ForegroundColor Red
    }
}

# ===== TESTE 5: COM TOKEN VÁLIDO =====
Write-Host "`n✅ TESTE 5: Acessar /rules COM token válido" -ForegroundColor Yellow
try {
    $r5 = Invoke-WebRequest -Uri "$BASE_URL/rules" -Headers @{"Authorization"="Bearer $global:token"} -UseBasicParsing
    $data = $r5.Content | ConvertFrom-Json
    Write-Host "   ✓ Sucesso! Dados recebidos" -ForegroundColor Green
    Write-Host "   Regras: $($data.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Falha: $($_)" -ForegroundColor Red
}

# ===== TESTE 6: ALERTS COM TOKEN =====
Write-Host "`n🚨 TESTE 6: Acessar /alerts COM token" -ForegroundColor Yellow
try {
    $r6 = Invoke-WebRequest -Uri "$BASE_URL/alerts" -Headers @{"Authorization"="Bearer $global:token"} -UseBasicParsing
    $data = $r6.Content | ConvertFrom-Json
    Write-Host "   ✓ Sucesso! Dados recebidos" -ForegroundColor Green
    Write-Host "   Alertas: $($data.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Falha: $($_)" -ForegroundColor Red
}

# ===== TESTE 7: TRAFFIC COM TOKEN =====
Write-Host "`n📊 TESTE 7: Acessar /traffic COM token" -ForegroundColor Yellow
try {
    $r7 = Invoke-WebRequest -Uri "$BASE_URL/traffic" -Headers @{"Authorization"="Bearer $global:token"} -UseBasicParsing
    $data = $r7.Content | ConvertFrom-Json
    Write-Host "   ✓ Sucesso! Dados recebidos" -ForegroundColor Green
    Write-Host "   Tráfego: $($data.Count) registros" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Falha: $($_)" -ForegroundColor Red
}

# ===== TESTE 8: SENHA ERRADA =====
Write-Host "`n❌ TESTE 8: Login com senha errada (deve bloquear)" -ForegroundColor Yellow
$body = @{
    email = "admin@netsheriff.com"
    password = "senha_errada"
} | ConvertTo-Json

try {
    $r8 = Invoke-WebRequest -Uri "$BASE_URL/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    Write-Host "   ✗ Falha: Senha errada foi aceita!" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.Value__
    if ($code -eq 401) {
        Write-Host "   ✓ Correto! Bloqueado com status 401" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Status inesperado: $code" -ForegroundColor Red
    }
}

# ===== RESUMO =====
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TESTES CONCLUÍDOS!            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n✅ Todos os testes foram executados!" -ForegroundColor Green
Write-Host "Se viu 8 ✓ = SUCESSO TOTAL!" -ForegroundColor Green
Write-Host "`nO que foi testado:" -ForegroundColor Cyan
Write-Host "  • Registro de novo usuário" -ForegroundColor White
Write-Host "  • Login com credenciais corretas" -ForegroundColor White
Write-Host "  • Obtenção de dados do usuário" -ForegroundColor White
Write-Host "  • Proteção de endpoints (sem token)" -ForegroundColor White
Write-Host "  • Acesso com token válido" -ForegroundColor White
Write-Host "  • Endpoints /rules, /alerts, /traffic" -ForegroundColor White
Write-Host "  • Bloqueio de credenciais inválidas`n" -ForegroundColor White
