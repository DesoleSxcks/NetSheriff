#!/usr/bin/env node
/**
 * NetSheriff - Teste de Autenticação Completo
 * Executa testes de integração backend/frontend
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

let token = null;
let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    log(`\n▶ ${name}...`, 'blue');
    await fn();
    log(`✓ ${name}`, 'green');
    testsPassed++;
  } catch (error) {
    log(`✗ ${name}: ${error.message}`, 'red');
    testsFailed++;
  }
}

async function main() {
  log('\n╔════════════════════════════════════════╗', 'yellow');
  log('║  NetSheriff - Testes de Autenticação  ║', 'yellow');
  log('╚════════════════════════════════════════╝\n', 'yellow');

  // ===== TESTES =====

  // 1. TESTE DE REGISTRO
  await test('1. Registrar novo usuário', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `teste_${Date.now()}@netsheriff.com`,
        password: 'senha123',
        name: 'Usuário Teste'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error('Token não retornado');
    token = data.token;
    log(`   Email: ${data.user.email}`, 'green');
    log(`   Token: ${data.token.slice(0, 20)}...`, 'green');
  });

  // 2. TESTE DE LOGIN
  await test('2. Fazer login com usuário existente', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@netsheriff.com',
        password: 'senha123'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error('Token não retornado');
    token = data.token;
    log(`   Email: ${data.user.email}`, 'green');
    log(`   Nome: ${data.user.name}`, 'green');
  });

  // 3. TESTE DE OBTENÇÃO DE USUÁRIO
  await test('3. Obter dados do usuário autenticado', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const user = await res.json();
    if (!user.id || !user.email) throw new Error('Dados incompletos');
    log(`   ID: ${user.id}`, 'green');
    log(`   Email: ${user.email}`, 'green');
    log(`   Criado em: ${user.createdAt}`, 'green');
  });

  // 4. TESTE DE PROTEÇÃO SEM TOKEN
  await test('4. Tentar acessar endpoint protegido SEM token (deve falhar)', async () => {
    const res = await fetch(`${BASE_URL}/rules`);
    if (res.ok) throw new Error('Endpoint não estava protegido!');
    if (res.status !== 401) throw new Error(`Status esperado 401, recebido ${res.status}`);
    log(`   Status: ${res.status} (Correto - acesso negado)`, 'green');
  });

  // 5. TESTE DE PROTEÇÃO COM TOKEN INVÁLIDO
  await test('5. Tentar com token inválido (deve falhar)', async () => {
    const res = await fetch(`${BASE_URL}/rules`, {
      headers: { Authorization: 'Bearer token_invalido_123' }
    });
    if (res.ok) throw new Error('Endpoint aceitou token inválido!');
    if (res.status !== 401) throw new Error(`Status esperado 401, recebido ${res.status}`);
    log(`   Status: ${res.status} (Correto - token rejeitado)`, 'green');
  });

  // 6. TESTE DE ACESSO A ENDPOINTS COM TOKEN VÁLIDO
  await test('6. Acessar /api/rules com token válido', async () => {
    const res = await fetch(`${BASE_URL}/rules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rules = await res.json();
    log(`   Regras retornadas: ${Array.isArray(rules) ? rules.length : 'erro'}`, 'green');
  });

  await test('7. Acessar /api/alerts com token válido', async () => {
    const res = await fetch(`${BASE_URL}/alerts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const alerts = await res.json();
    log(`   Alertas retornados: ${Array.isArray(alerts) ? alerts.length : 'erro'}`, 'green');
  });

  await test('8. Acessar /api/traffic com token válido', async () => {
    const res = await fetch(`${BASE_URL}/traffic`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const traffic = await res.json();
    log(`   Tráfego retornado: ${Array.isArray(traffic) ? traffic.length : 'erro'}`, 'green');
  });

  // 7. TESTE DE LOGIN COM CREDENCIAIS ERRADAS
  await test('9. Tentar login com senha incorreta (deve falhar)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@netsheriff.com',
        password: 'senha_errada'
      })
    });
    if (res.ok) throw new Error('Login aceitou senha errada!');
    if (res.status !== 401) throw new Error(`Status esperado 401, recebido ${res.status}`);
    log(`   Status: ${res.status} (Correto - acesso negado)`, 'green');
  });

  // 8. TESTE DE REGISTRO COM EMAIL DUPLICADO
  await test('10. Tentar registrar com email já existente (deve falhar)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@netsheriff.com',
        password: 'senha123',
        name: 'Teste'
      })
    });
    if (res.ok) throw new Error('Registro aceitou email duplicado!');
    if (res.status !== 409) throw new Error(`Status esperado 409, recebido ${res.status}`);
    log(`   Status: ${res.status} (Correto - email já existe)`, 'green');
  });

  // ===== RESULTADOS =====
  log('\n╔════════════════════════════════════════╗', 'yellow');
  log('║            RESULTADOS                 ║', 'yellow');
  log('╚════════════════════════════════════════╝', 'yellow');
  log(`\n✓ Testes Passou: ${testsPassed}`, 'green');
  log(`✗ Testes Falharam: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`Total: ${testsPassed + testsFailed}\n`, 'blue');

  if (testsFailed === 0) {
    log('🎉 TODOS OS TESTES PASSARAM!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Alguns testes falharam', 'red');
    process.exit(1);
  }
}

main().catch(err => {
  log(`\n❌ Erro ao executar testes: ${err.message}`, 'red');
  process.exit(1);
});
