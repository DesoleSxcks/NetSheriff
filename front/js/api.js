const BASE_URL = "http://localhost:3000/api";

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error || data?.message || response.statusText || 'Erro na requisição';
    throw new Error(message);
  }

  return data;
}

export async function login(email, password) {
  const data = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (data?.token) {
    localStorage.setItem('authToken', data.token);
  }

  return data;
}

export async function register(email, password, name) {
  const data = await requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });

  if (data?.token) {
    localStorage.setItem('authToken', data.token);
  }

  return data;
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('authToken'));
}

export function logout() {
  localStorage.removeItem('authToken');
}

export async function fetchRules() {
  try {
    return await requestJson('/rules');
  } catch (error) {
    alert('Falha ao buscar regras: ' + error.message);
    return [];
  }
}

export async function createRule(rule) {
  try {
    return await requestJson('/rules', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
  } catch (error) {
    alert('Falha ao criar regra: ' + error.message);
    return null;
  }
}

export async function updateRuleStatus(id, status) {
  try {
    return await requestJson(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  } catch (error) {
    alert('Falha ao atualizar status: ' + error.message);
    return null;
  }
}

export async function updateRuleName(id, name) {
  try {
    return await requestJson(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  } catch (error) {
    alert('Falha ao atualizar nome: ' + error.message);
    return null;
  }
}

export async function deleteRule(id) {
  try {
    await requestJson(`/rules/${id}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    alert('Falha ao remover regra: ' + error.message);
    return false;
  }
}

export async function fetchAlertsData() {
  try {
    return await requestJson('/alerts');
  } catch (error) {
    alert('Falha ao buscar alertas: ' + error.message);
    return [];
  }
}

export async function fetchTrafficData() {
  try {
    return await requestJson('/traffic');
  } catch (error) {
    alert('Falha ao buscar tráfego: ' + error.message);
    return { labels: [], data: [] };
  }
}
