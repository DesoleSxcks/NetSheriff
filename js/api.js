// js/api.js
const BASE_URL = "http://localhost:3000";

export async function fetchRules() {
    const res = await fetch(`${BASE_URL}/rules`);
    if (!res.ok) throw new Error("Erro ao buscar regras");
    return await res.json();
}

export async function updateRuleStatus(id, status) {
    const res = await fetch(`${BASE_URL}/rules/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ status })
    });
    return await res.json();
}

export async function updateRuleName(id, name) {
    const res = await fetch(`${BASE_URL}/rules/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name })
    });
    return await res.json();
}

export async function deleteRule(id) {
    const res = await fetch(`${BASE_URL}/rules/${id}`, {
        method: 'DELETE'
    });
    return await res.json();
}