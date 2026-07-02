// Página de regras (rules.html): listagem, criação, edição, ativação/
// desativação, remoção e busca de regras de detecção.

import { fetchRules, createRule, updateRule, updateRuleStatus, deleteRule } from './api.js';
import { showNotification, setTableStatusMessage, setButtonBusy, getPortugueseMessage, matchesQuery } from './utils.js';
import { registerSearchFilter, getSearchQuery } from './search.js';

const RULES_TABLE_COLUMNS = 6;

let currentRules = [];
let rulesSearchQuery = '';
let currentRuleForEdit = null;
let pendingRuleRemoval = null;

function getRulesTableBody() {
    return document.querySelector('#rulesTable tbody');
}

function resetRuleForm() {
    const nameInput = document.getElementById('ruleName');
    const conditionInput = document.getElementById('ruleCondition');
    const actionInput = document.getElementById('ruleAction');
    const ruleIdInput = document.getElementById('ruleId');
    if (nameInput) nameInput.value = '';
    if (conditionInput) conditionInput.value = '';
    if (actionInput) actionInput.value = 'Alert';
    if (ruleIdInput) ruleIdInput.value = '';
    currentRuleForEdit = null;
}

function openRuleModal(rule = null) {
    const modal = document.getElementById('addRuleModal');
    const title = document.getElementById('addRuleModalLabel');
    const nameInput = document.getElementById('ruleName');
    const conditionInput = document.getElementById('ruleCondition');
    const actionInput = document.getElementById('ruleAction');
    const ruleIdInput = document.getElementById('ruleId');
    const saveButton = document.getElementById('saveRuleBtn');

    if (!modal || !title || !nameInput || !conditionInput || !actionInput || !ruleIdInput || !saveButton) {
        return;
    }

    currentRuleForEdit = rule || null;
    ruleIdInput.value = rule ? String(rule.id) : '';
    nameInput.value = rule?.name || '';
    conditionInput.value = rule?.condition || '';
    actionInput.value = rule?.action || 'Alert';
    title.textContent = rule ? 'Editar Regra' : 'Adicionar Nova Regra';
    saveButton.textContent = rule ? 'Salvar Alterações' : 'Salvar Regra';

    if (window.$) {
        window.$(modal).modal('show');
    }
}

function showRemoveRuleConfirm(rule) {
    const modal = document.getElementById('confirmRuleDeleteModal');
    const message = document.getElementById('confirmRuleDeleteMessage');
    if (!modal || !message) {
        return;
    }

    pendingRuleRemoval = rule;
    message.textContent = `Deseja remover a regra "${rule?.name || 'esta regra'}"?`;

    if (window.$) {
        window.$(modal).modal('show');
    }
}

function filterRules(query) {
    return currentRules.filter((rule) => matchesQuery([
        rule.id,
        rule.name,
        rule.condition,
        rule.action,
        rule.status
    ], query));
}

function renderRulesTable(rules) {
    const tableBody = getRulesTableBody();
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!rules || rules.length === 0) {
        const searching = Boolean(rulesSearchQuery);
        setTableStatusMessage(tableBody, {
            type: 'info',
            message: searching ? 'Nenhum resultado encontrado.' : 'Nenhuma regra cadastrada.',
            colSpan: RULES_TABLE_COLUMNS
        });
        return;
    }

    rules.forEach(rule => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = rule.id;
        tr.appendChild(tdId);

        const tdName = document.createElement('td');
        tdName.textContent = rule.name;
        tr.appendChild(tdName);

        const tdCond = document.createElement('td');
        tdCond.textContent = rule.condition;
        tr.appendChild(tdCond);

        const tdAction = document.createElement('td');
        tdAction.textContent = rule.action;
        tr.appendChild(tdAction);

        // Status (Lógica de Badge)
        const tdStatus = document.createElement('td');
        const span = document.createElement('span');

        const statusValue = String(rule.status || 'Inativa').trim();
        const isActive = statusValue.toLowerCase() === 'ativa' || statusValue.toLowerCase() === 'active';
        span.textContent = statusValue;
        span.classList.add('badge', isActive ? 'badge-success' : 'badge-secondary');
        tdStatus.appendChild(span);
        tr.appendChild(tdStatus);

        const tdBtns = document.createElement('td');

        // Editar (PUT)
        const btnEdit = document.createElement('button');
        btnEdit.textContent = 'Editar';
        btnEdit.classList.add('btn', 'btn-sm', 'btn-outline-warning', 'mr-1');
        btnEdit.addEventListener('click', () => openRuleModal(rule));
        tdBtns.appendChild(btnEdit);

        // Alternar Status (PATCH)
        const btnToggle = document.createElement('button');
        btnToggle.textContent = isActive ? 'Desativar' : 'Ativar';
        btnToggle.classList.add('btn', 'btn-sm', isActive ? 'btn-danger' : 'btn-success', 'mr-1');
        btnToggle.addEventListener('click', async () => {
            try {
                await updateRuleStatus(rule.id, isActive ? 'Inativa' : 'Ativa');
                loadRules();
                showNotification({ type: 'success', title: 'Status atualizado', message: `Regra ${isActive ? 'desativada' : 'ativada'} com sucesso.` });
            } catch (error) {
                showNotification({ type: 'error', title: 'Erro ao alterar status', message: getPortugueseMessage(error, 'Não foi possível alterar o status da regra.') });
            }
        });
        tdBtns.appendChild(btnToggle);

        // Remover (DELETE)
        const btnRemove = document.createElement('button');
        btnRemove.textContent = 'Remover';
        btnRemove.classList.add('btn', 'btn-sm', 'btn-outline-danger');
        btnRemove.addEventListener('click', () => showRemoveRuleConfirm(rule));
        tdBtns.appendChild(btnRemove);

        tr.appendChild(tdBtns);
        tableBody.appendChild(tr);
    });
}

function applyRulesSearch(query) {
    rulesSearchQuery = query;
    renderRulesTable(filterRules(query));
}

async function loadRules() {
    const tableBody = getRulesTableBody();
    if (!tableBody) return;

    setTableStatusMessage(tableBody, { type: 'loading', message: 'Carregando regras...', colSpan: RULES_TABLE_COLUMNS });

    try {
        const rules = await fetchRules();
        currentRules = Array.isArray(rules) ? rules : [];
        rulesSearchQuery = getSearchQuery();
        renderRulesTable(filterRules(rulesSearchQuery));
    } catch (error) {
        console.error('Erro ao renderizar tabela:', error);
        setTableStatusMessage(tableBody, { type: 'error', message: getPortugueseMessage(error, 'Erro ao conectar com o servidor.'), colSpan: RULES_TABLE_COLUMNS });
        showNotification({ type: 'error', title: 'Erro ao carregar regras', message: getPortugueseMessage(error, 'Erro ao conectar com o servidor.') });
    }
}

async function handleSaveRule() {
    const saveRuleBtn = document.getElementById('saveRuleBtn');
    const name = document.getElementById('ruleName').value.trim();
    const condition = document.getElementById('ruleCondition').value.trim();
    const action = document.getElementById('ruleAction').value.trim();
    const ruleId = document.getElementById('ruleId').value;

    if (!name || !condition) {
        showNotification({ type: 'warning', title: 'Validação', message: 'Preencha o nome e a condição da regra antes de salvar.' });
        return;
    }

    const isEditing = Boolean(ruleId);
    const payload = {
        name,
        condition,
        action,
        status: currentRuleForEdit?.status || 'Ativa'
    };
    setButtonBusy(saveRuleBtn, true, 'Salvando...');
    try {
        const saved = isEditing ? await updateRule(Number(ruleId), payload) : await createRule(payload);
        if (saved) {
            loadRules();
            resetRuleForm();
            if (window.$) {
                window.$('#addRuleModal').modal('hide');
            }
            showNotification({
                type: 'success',
                title: isEditing ? 'Regra atualizada' : 'Regra criada',
                message: isEditing ? 'Alterações salvas com sucesso.' : 'Regra adicionada com sucesso.'
            });
        }
    } catch (error) {
        showNotification({ type: 'error', title: isEditing ? 'Erro ao atualizar regra' : 'Erro ao criar regra', message: getPortugueseMessage(error, 'Não foi possível salvar a regra.') });
    } finally {
        setButtonBusy(saveRuleBtn, false);
    }
}

async function handleConfirmDeleteRule() {
    if (!pendingRuleRemoval) return;
    try {
        await deleteRule(pendingRuleRemoval.id);
        pendingRuleRemoval = null;
        loadRules();
        if (window.$) {
            window.$('#confirmRuleDeleteModal').modal('hide');
        }
        showNotification({ type: 'success', title: 'Regra removida', message: 'Regra removida com sucesso.' });
    } catch (error) {
        showNotification({ type: 'error', title: 'Erro ao remover regra', message: getPortugueseMessage(error, 'Não foi possível remover a regra.') });
    }
}

export function initRulesPage() {
    if (!document.getElementById('rulesTable')) {
        return;
    }

    const saveRuleBtn = document.getElementById('saveRuleBtn');
    if (saveRuleBtn) {
        saveRuleBtn.addEventListener('click', handleSaveRule);
    }

    const confirmDeleteRuleBtn = document.getElementById('confirmDeleteRuleBtn');
    if (confirmDeleteRuleBtn) {
        confirmDeleteRuleBtn.addEventListener('click', handleConfirmDeleteRule);
    }

    registerSearchFilter(applyRulesSearch);
    loadRules();
}
