const BASE_URL = "http://localhost:3000";

export async function fetchRules() {
    try {
        const res = await fetch(`${BASE_URL}/rules`);
        if (!res.ok) throw new Error("Erro ao buscar regras");
        return await res.json();
    } catch (error) {
        alert("Falha ao buscar regras: " + error.message);
        return [];
    }
}

export async function createRule(rule) {
    try {
        const res = await fetch(`${BASE_URL}/rules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rule)
        });
        if (!res.ok) throw new Error("Erro ao criar regra");
        return await res.json();
    } catch (error) {
        alert("Falha ao criar regra: " + error.message);
        return null;
    }
}

export async function updateRuleStatus(id, status) {
    try {
        const res = await fetch(`${BASE_URL}/rules/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error("Erro ao atualizar status da regra");
        return await res.json();
    } catch (error) {
        alert("Falha ao atualizar status: " + error.message);
        return null;
    }
}

export async function updateRuleName(id, name) {
    try {
        const res = await fetch(`${BASE_URL}/rules/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error("Erro ao atualizar nome da regra");
        return await res.json();
    } catch (error) {
        alert("Falha ao atualizar nome: " + error.message);
        return null;
    }
}

export async function deleteRule(id) {
    try {
        const res = await fetch(`${BASE_URL}/rules/${id}`, {
            method: "DELETE" });
        if (!res.ok) throw new Error("Erro ao remover regra");
        return true;
    } catch (error) {
        alert("Falha ao remover regra: " + error.message);
        return false;
    }
}

export async function fetchAlertsData() {
    try {
        const res = await fetch(`${BASE_URL}/alerts`);
        if (!res.ok) throw new Error("Erro ao buscar alertas");
        return await res.json();
    } catch (error) {
        alert("Falha ao buscar alertas: " + error.message);
        return [];
    }
}

export async function fetchTrafficData() {
    try {
        const res = await fetch(`${BASE_URL}/traffic`);
        if (!res.ok) throw new Error("Erro ao buscar dados de tráfego");
        return await res.json();
    } catch (error) {
        alert("Falha ao buscar tráfego: " + error.message);
        return { labels: [], data: [] };
    }
}