// Dashboard (index.html): cards de resumo, tabelas de alertas recentes e
// regras rápidas, resumo da auditoria e geração de relatório CSV.

import { fetchRules, fetchAlertsData, fetchIptablesAudit } from './api.js';
import { showNotification, setTableStatusMessage, getPortugueseMessage, formatAlertOrigin, matchesQuery, downloadFile, tableToCsv } from './utils.js';
import { registerSearchFilter, getSearchQuery } from './search.js';

let dashboardAlerts = [];
let dashboardRules = [];

function isFirewallOrigin(origin) {
    const normalized = String(origin || '').toLowerCase();
    return normalized === 'iptables' || normalized === 'auditoria firewall';
}

function isDockerFinding(entry) {
    const text = `${entry.title || ''} ${entry.description || ''} ${entry.origin || ''}`.toLowerCase();
    return text.includes('docker') || text.includes('docker-') || text.includes('docker bridge');
}

function isRelevantFirewallFinding(finding) {
    if (!finding || isDockerFinding(finding)) return false;
    const severity = String(finding.severity || '').toLowerCase();
    if (!['high', 'medium'].includes(severity)) return false;

    const text = `${finding.title || ''} ${finding.description || ''}`.toLowerCase();
    if (text.includes('docker')) return false;
    if (text.includes('accept') && (text.includes('input') || text.includes('any') || text.includes('all') || text.includes('genérica') || text.includes('generic'))) {
        return true;
    }
    if (text.includes('política padrão') && text.includes('accept')) {
        return true;
    }
    if (text.includes('sem drop') || text.includes('sem reject') || text.includes('sem rejeição') || text.includes('sem regras de drop') || text.includes('sem regras de reject')) {
        return true;
    }
    if (text.includes('porta aberta') || text.includes('port open') || text.includes('sensitive port') || text.includes('porta sensível')) {
        return true;
    }
    return false;
}

function mapFirewallFindingToAlert(finding, index, checkedAt) {
    return {
        id: `fw-${index + 1}`,
        timestamp: finding.checkedAt || checkedAt || new Date().toISOString(),
        type: finding.title || 'Achado de auditoria',
        origin: 'Auditoria Firewall',
        description: finding.description || finding.title || '',
        severity: String(finding.severity || 'Medium').charAt(0).toUpperCase() + String(finding.severity || 'Medium').slice(1).toLowerCase()
    };
}

function buildDashboardAlerts(alerts, auditData) {
    const firewallAlerts = Array.isArray(alerts)
        ? alerts.filter((alert) => isFirewallOrigin(alert.origin) && !isDockerFinding(alert)).slice(0, 3)
        : [];

    if (!firewallAlerts.length && auditData?.allFindings?.length) {
        const relevantFindings = auditData.allFindings
            .filter(isRelevantFirewallFinding)
            .slice(0, 3)
            .map((finding, index) => mapFirewallFindingToAlert(finding, index, auditData.checkedAt));
        firewallAlerts.push(...relevantFindings);
    }

    const systemAlerts = Array.isArray(alerts)
        ? alerts.filter((alert) => !isFirewallOrigin(alert.origin)).slice(0, 2)
        : [];

    return [...firewallAlerts, ...systemAlerts].slice(0, 3);
}

function filterDashboardAlerts(query) {
    return dashboardAlerts.filter((alert) => matchesQuery([
        alert.id,
        alert.timestamp,
        alert.type,
        formatAlertOrigin(alert.origin),
        alert.description,
        alert.severity
    ], query));
}

function filterDashboardRules(query) {
    return dashboardRules.filter((rule) => matchesQuery([
        rule.id,
        rule.name,
        rule.action,
        rule.condition,
        rule.status
    ], query));
}

function renderDashboardAlertsTable(alertRows, { searching = false } = {}) {
    const alertsTableBody = document.getElementById('dashboardAlertsTableBody');
    if (!alertsTableBody) return;

    alertsTableBody.innerHTML = '';
    if (!alertRows.length) {
        setTableStatusMessage(alertsTableBody, {
            type: 'info',
            message: searching ? 'Nenhum resultado encontrado.' : 'Nenhum alerta recente encontrado.'
        });
        return;
    }

    alertRows.forEach(alert => {
        const tr = document.createElement('tr');
        const tdId = document.createElement('td');
        tdId.textContent = alert.id;
        tr.appendChild(tdId);

        const tdTs = document.createElement('td');
        tdTs.textContent = alert.timestamp;
        tr.appendChild(tdTs);

        const tdType = document.createElement('td');
        tdType.textContent = alert.type;
        tr.appendChild(tdType);

        const tdOrigin = document.createElement('td');
        tdOrigin.textContent = formatAlertOrigin(alert.origin);
        tr.appendChild(tdOrigin);

        const tdDesc = document.createElement('td');
        tdDesc.textContent = alert.description;
        tr.appendChild(tdDesc);

        const tdSev = document.createElement('td');
        const span = document.createElement('span');
        span.textContent = alert.severity;
        if (alert.severity === 'High') span.classList.add('badge', 'badge-danger');
        else if (alert.severity === 'Medium') span.classList.add('badge', 'badge-warning');
        else span.classList.add('badge', 'badge-success');
        tdSev.appendChild(span);
        tr.appendChild(tdSev);

        alertsTableBody.appendChild(tr);
    });
}

function renderDashboardRulesTable(rules, { searching = false } = {}) {
    const rulesTable = document.getElementById('dashboardRulesTable');
    if (!rulesTable) return;
    const tbody = rulesTable.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!rules.length) {
        if (searching) {
            setTableStatusMessage(tbody, { type: 'info', message: 'Nenhum resultado encontrado.', colSpan: 3 });
        }
        return;
    }

    rules.slice(0, 3).forEach(rule => {
        const tr = document.createElement('tr');
        const tdId = document.createElement('td');
        tdId.textContent = rule.id;
        tr.appendChild(tdId);

        const tdName = document.createElement('td');
        tdName.textContent = rule.name;
        tr.appendChild(tdName);

        const tdAction = document.createElement('td');
        tdAction.textContent = rule.action;
        tr.appendChild(tdAction);
        tbody.appendChild(tr);
    });
}

function applyDashboardSearch(query) {
    const searching = Boolean(query);
    renderDashboardAlertsTable(filterDashboardAlerts(query), { searching });
    renderDashboardRulesTable(filterDashboardRules(query), { searching });
}

function handleGenerateReport(event) {
    event.preventDefault();
    const table = document.getElementById('dashboardAlertsTable');
    const data = table ? tableToCsv(table) : null;
    if (!data) {
        showNotification({ type: 'warning', title: 'Relatório', message: 'Não há dados de dashboard para gerar relatório.' });
        return;
    }
    downloadFile('relatorio-dashboard.csv', data);
}

async function loadDashboard() {
    try {
        const [alerts, rules] = await Promise.all([
            fetchAlertsData(),
            fetchRules()
        ]);

        dashboardRules = Array.isArray(rules) ? rules : [];

        // Atualiza Card Alertas Críticos
        const critCard = document.querySelector('.text-danger.text-uppercase.mb-1');
        if (critCard) {
            const critNum = critCard.parentElement.querySelector('.h5');
            if (critNum) {
                const highCount = alerts.filter(a => a.severity === 'High').length;
                critNum.textContent = highCount;
            }
        }

        // Atualiza Card Regras Ativas
        const regrasCard = document.querySelector('.text-success.text-uppercase.mb-1');
        if (regrasCard) {
            const regrasNum = regrasCard.parentElement.querySelector('.h5');
            if (regrasNum) {
                regrasNum.textContent = dashboardRules.length;
            }
        }

        // Atualiza resumo da auditoria de firewall
        const auditSummaryStatus = document.getElementById('auditSummaryStatus');
        const auditSummaryText = document.getElementById('auditSummaryText');
        let audit = null;
        try {
            audit = await fetchIptablesAudit();
            if (auditSummaryStatus) {
                auditSummaryStatus.textContent = audit.available ? 'Disponível' : 'Indisponível';
            }
            if (auditSummaryText) {
                const riskLevel = audit.summary?.riskLevel || 'unknown';
                const findingsCount = audit.summary?.findingsCount ?? 0;
                auditSummaryText.textContent = audit.available
                    ? `${String(riskLevel).toUpperCase()} • ${findingsCount} achados`
                    : 'Auditoria real indisponível';
            }
        } catch (error) {
            if (auditSummaryStatus) {
                auditSummaryStatus.textContent = 'Indisponível';
            }
            if (auditSummaryText) {
                auditSummaryText.textContent = 'Dados reais do firewall indisponíveis';
            }
        }

        dashboardAlerts = buildDashboardAlerts(alerts, audit);
        applyDashboardSearch(getSearchQuery());
    } catch (error) {
        showNotification({ type: 'error', title: 'Erro no dashboard', message: getPortugueseMessage(error, 'Não foi possível carregar o dashboard.') });
    }
}

export function initDashboard() {
    if (!document.getElementById('dashboardAlertsTableBody') && !document.getElementById('dashboardRulesTable')) {
        return;
    }

    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', handleGenerateReport);
    }

    registerSearchFilter(applyDashboardSearch);
    loadDashboard();
}
