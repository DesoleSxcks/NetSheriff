const BASE_URL = "http://localhost:3000/api";
const DEMO_AUTH_KEY = 'demoAuth';
const AUTH_USER_KEY = 'authUser';
const RULES_STORAGE_KEY = 'netsheriff.rules';

const mockRules = [
  { id: 1, name: 'Bloquear tráfego suspeito', condition: 'src_ip = 10.0.0.5', action: 'Bloquear', status: 'Ativa' },
  { id: 2, name: 'Alertar sobre portas abertas', condition: 'port = 22', action: 'Alertar', status: 'Ativa' }
];

function readRulesStore() {
  try {
    const stored = localStorage.getItem(RULES_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(mockRules));
      return [...mockRules];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : [...mockRules];
  } catch (error) {
    return [...mockRules];
  }
}

function writeRulesStore(rules) {
  const normalized = Array.isArray(rules) ? rules : [];
  localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

const mockAlerts = [
  { id: 1, timestamp: '2026-06-25T10:00:00.000Z', type: 'Brute Force', description: 'Tentativas repetidas de login', severity: 'High', status: 'Aberto' },
  { id: 2, timestamp: '2026-06-25T09:30:00.000Z', type: 'Port Scan', description: 'Varredura de portas detectada', severity: 'Medium', status: 'Em análise' }
];

const mockTraffic = {
  labels: ['08:00', '09:00', '10:00', '11:00', '12:00'],
  data: [120, 190, 260, 220, 310]
};

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function saveAuthData(data) {
  if (data?.token) {
    localStorage.setItem('authToken', data.token);
  }

  if (data?.user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  }
}

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    return null;
  }
}

function clearAuthData() {
  localStorage.removeItem('authToken');
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(DEMO_AUTH_KEY);
}

function getHttpErrorMessage(response, data, path) {
  const fallback = data?.error || data?.message || response.statusText || 'Erro na requisição';

  switch (response.status) {
    case 400:
      return data?.details?.length ? `${fallback}: ${data.details.join(' • ')}` : 'Requisição inválida.';
    case 401:
      if (path === '/auth/login') {
        return data?.error || 'Login ou senha errados.';
      }
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para esta ação.';
    case 404:
      return 'Recurso não encontrado.';
    case 409:
      return data?.error || 'Conflito de dados.';
    case 422:
      return data?.error || 'Os dados enviados são inválidos.';
    case 500:
      return 'Erro interno do servidor.';
    default:
      return fallback;
  }
}

async function requestJson(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 1800);

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (error) {
    globalThis.clearTimeout(timeoutId);
    const isTimeout = error?.name === 'AbortError' || error?.message?.includes('timed out');

    if (path === '/auth/login' || path === '/auth/register') {
      const payload = options.body ? JSON.parse(options.body) : {};
      const email = payload.email || payload.username || '';
      const name = payload.name || 'Usuário';

      localStorage.setItem(DEMO_AUTH_KEY, 'true');
      const fallbackData = {
        token: 'demo-token',
        user: {
          id: 1,
          email,
          name
        },
        message: 'Login local ativado. Você entrou em modo demonstração.'
      };
      saveAuthData(fallbackData);

      return fallbackData;
    }

    if (path === '/rules') {
      const rules = readRulesStore();
      if (options.method === 'POST') {
        const payload = options.body ? JSON.parse(options.body) : {};
        const newRule = {
          id: Date.now(),
          name: payload.name || 'Nova regra',
          condition: payload.condition || 'Sem condição',
          action: payload.action || 'Alert',
          status: payload.status || 'Ativa'
        };
        writeRulesStore([...rules, newRule]);
        return newRule;
      }
      return rules;
    }

    if (path.startsWith('/rules/')) {
      const id = Number(path.split('/').pop());
      const rules = readRulesStore();
      const currentRule = rules.find((rule) => rule.id === id);

      if (!currentRule) {
        return null;
      }

      if (options.method === 'PUT' || options.method === 'PATCH') {
        const payload = options.body ? JSON.parse(options.body) : {};
        const updatedRule = {
          ...currentRule,
          ...payload,
          id: currentRule.id
        };
        writeRulesStore(rules.map((rule) => rule.id === id ? updatedRule : rule));
        return updatedRule;
      }

      if (options.method === 'DELETE') {
        writeRulesStore(rules.filter((rule) => rule.id !== id));
        return true;
      }

      return currentRule;
    }

    if (path === '/alerts') return mockAlerts;
    if (path === '/traffic') return mockTraffic;

    const networkError = new Error(isTimeout ? 'Tempo limite excedido ao conectar ao servidor.' : 'Não foi possível conectar ao servidor.');
    networkError.status = 0;
    throw networkError;
  }

  globalThis.clearTimeout(timeoutId);

  let data = null;
  const text = await response.text();

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = null;
    }
  }

  if (!response.ok) {
    const message = getHttpErrorMessage(response, data, path);
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function login(email, password) {
  const data = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (data?.token) {
    saveAuthData(data);
  }

  return data;
}

export async function register(email, password, name) {
  const data = await requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });

  if (data?.token) {
    saveAuthData(data);
  }

  return data;
}

export function getCurrentUser() {
  return getStoredUser();
}

export async function fetchCurrentUser() {
  const user = await requestJson('/auth/me');
  if (user) {
    saveAuthData({ user });
  }
  return user;
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('authToken') || localStorage.getItem(DEMO_AUTH_KEY));
}

export function logout() {
  clearAuthData();
}

export async function fetchRules() {
  return await requestJson('/rules');
}

export async function createRule(rule) {
  return await requestJson('/rules', {
    method: 'POST',
    body: JSON.stringify(rule)
  });
}

export async function updateRule(id, updates) {
  return await requestJson(`/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function updateRuleStatus(id, status) {
  return await requestJson(`/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function updateRuleName(id, name) {
  return await updateRule(id, { name });
}

export async function deleteRule(id) {
  await requestJson(`/rules/${id}`, {
    method: 'DELETE'
  });
  return true;
}

function sortBySeverity(alerts) {
  const priority = { high: 0, medium: 1, low: 2, info: 3 };
  const firewallOrigins = new Set(['iptables', 'auditoria firewall']);

  return alerts.slice().sort((a, b) => {
    const aSeverity = priority[String(a.severity || '').toLowerCase()] ?? 4;
    const bSeverity = priority[String(b.severity || '').toLowerCase()] ?? 4;
    if (aSeverity !== bSeverity) return aSeverity - bSeverity;

    const aOrigin = String(a.origin || '').toLowerCase();
    const bOrigin = String(b.origin || '').toLowerCase();
    const aFirewall = firewallOrigins.has(aOrigin);
    const bFirewall = firewallOrigins.has(bOrigin);
    if (aFirewall !== bFirewall) return aFirewall ? -1 : 1;

    return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
  });
}

function limitAuditAlerts(auditAlerts, max = 5) {
  return sortBySeverity(auditAlerts).slice(0, max);
}

export async function fetchAlertsData() {
  const [alertsResult, auditResult] = await Promise.allSettled([
    requestJson('/alerts'),
    requestJson('/audit/iptables')
  ]);

  const alerts = Array.isArray(alertsResult.value) ? alertsResult.value : [];
  const auditAlerts = Array.isArray(auditResult.value?.alerts) ? auditResult.value.alerts.map((alert) => ({
    ...alert,
    origin: alert.origin || 'Auditoria Firewall'
  })) : [];

  const merged = [
    ...limitAuditAlerts(auditAlerts, 5),
    ...alerts.map((alert) => ({ ...alert, origin: alert.origin || 'Banco' }))
  ];

  return sortBySeverity(merged);
}

export async function fetchTrafficData() {
  return await requestJson('/traffic');
}

 

export async function fetchIptablesAudit() {
  return await requestJson('/audit/iptables');
}
