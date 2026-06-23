#!/usr/bin/env pwsh

# Script de teste para validar o tratamento centralizado de erros
# Uso: .\test-error-handler.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testes: Tratamento Centralizado de Erros" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
  param(
    [string]$name,
    [string]$method,
    [string]$endpoint,
    [object]$body,
    [int]$expectedStatus
  )

  Write-Host "[TESTE] $name" -ForegroundColor Yellow

  try {
    $uri = "$baseUrl$endpoint"
    $params = @{
      Uri             = $uri
      Method          = $method
      ContentType     = "application/json"
      UseBasicParsing = $true
    }

    if ($body) {
      $params['Body'] = $body | ConvertTo-Json
    }

    $response = Invoke-WebRequest @params
    $status = $response.StatusCode

  } catch {
    $status = $_.Exception.Response.StatusCode.Value__
    $response = $_
  }

  $statusOk = $status -eq $expectedStatus
  $symbol = if ($statusOk) { "✓" } else { "✗" }
  $color = if ($statusOk) { "Green" } else { "Red" }

  Write-Host "  $symbol Status: $status (esperado: $expectedStatus)" -ForegroundColor $color

  if ($statusOk) {
    $testsPassed++
    Write-Host "  ✓ PASSOU`n" -ForegroundColor Green
  } else {
    $testsFailed++
    Write-Host "  ✗ FALHOU`n" -ForegroundColor Red
  }
}

# ==================== TESTES ====================

Write-Host "1. TESTES DE VALIDAÇÃO (400 Bad Request)`n" -ForegroundColor Magenta

Test-Endpoint `
  -name "POST /register - Email faltando" `
  -method "POST" `
  -endpoint "/api/auth/register" `
  -body @{ password = "teste123"; name = "Teste" } `
  -expectedStatus 400

Test-Endpoint `
  -name "POST /register - Senha muito curta" `
  -method "POST" `
  -endpoint "/api/auth/register" `
  -body @{ email = "test@example.com"; password = "123"; name = "Teste" } `
  -expectedStatus 400

Test-Endpoint `
  -name "POST /alerts - Campo obrigatório faltando" `
  -method "POST" `
  -endpoint "/api/alerts" `
  -body @{ type = "SECURITY"; description = "Teste" } `
  -expectedStatus 400

Write-Host "2. TESTES DE AUTENTICAÇÃO (401 Unauthorized)`n" -ForegroundColor Magenta

Test-Endpoint `
  -name "POST /login - Senha errada" `
  -method "POST" `
  -endpoint "/api/auth/login" `
  -body @{ email = "admin@netsheriff.com"; password = "senha_errada" } `
  -expectedStatus 401

Test-Endpoint `
  -name "POST /login - Email não existe" `
  -method "POST" `
  -endpoint "/api/auth/login" `
  -body @{ email = "naoexiste@test.com"; password = "qualquer_senha" } `
  -expectedStatus 401

Write-Host "3. TESTES DE CONFLITO (409 Conflict)`n" -ForegroundColor Magenta

Test-Endpoint `
  -name "POST /register - Email duplicado" `
  -method "POST" `
  -endpoint "/api/auth/register" `
  -body @{ email = "admin@netsheriff.com"; password = "teste123"; name = "Duplicado" } `
  -expectedStatus 409

Write-Host "4. TESTES DE NÃO ENCONTRADO (404 Not Found)`n" -ForegroundColor Magenta

Test-Endpoint `
  -name "GET /alerts/999999 - Alerta não existe" `
  -method "GET" `
  -endpoint "/api/alerts/999999" `
  -body $null `
  -expectedStatus 404

Test-Endpoint `
  -name "GET /rota-inexistente - Endpoint não existe" `
  -method "GET" `
  -endpoint "/rota-inexistente" `
  -body $null `
  -expectedStatus 404

Write-Host "5. TESTES DE SUCESSO (200, 201 OK)`n" -ForegroundColor Magenta

Test-Endpoint `
  -name "GET /health - Health check" `
  -method "GET" `
  -endpoint "/health" `
  -body $null `
  -expectedStatus 200

# ==================== RESUMO ====================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Resumo dos Testes" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$total = $testsPassed + $testsFailed
$percentual = if ($total -gt 0) { [math]::Round(($testsPassed / $total) * 100) } else { 0 }

Write-Host "✓ Testes Passados:  $testsPassed" -ForegroundColor Green
Write-Host "✗ Testes Falhados:  $testsFailed" -ForegroundColor Red
Write-Host "─────────────────────────────" -ForegroundColor Gray
Write-Host "  Total:             $total" -ForegroundColor White
Write-Host "  Taxa de Sucesso:   $percentual%" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
  Write-Host "`n✓ Todos os testes passaram!" -ForegroundColor Green
} else {
  Write-Host "`n✗ Alguns testes falharam. Verifique os logs." -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Retornar código de saída apropriado
exit if ($testsFailed -gt 0) { 1 } else { 0 }
