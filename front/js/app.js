import { fetchRules, createRule, updateRule, updateRuleStatus, updateRuleName, deleteRule, fetchAlertsData, fetchTrafficData, fetchIptablesAudit, getCurrentUser, isAuthenticated, logout } from './api.js';

function ensureNotificationContainer() {
    let container = document.getElementById('appNotifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'appNotifications';
        container.className = 'app-notifications';
        document.body.appendChild(container);
    }
    return container;
}

function showNotification({ type = 'info', title, message, duration = 2800 }) {
    const container = ensureNotificationContainer();
    const toast = document.createElement('div');
    toast.className = `app-notification ${type}`;

    const iconMap = {
        success: '✓',
        error: '!',
        warning: '⚠',
        info: 'i'
    };

    const titleText = title || (type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : type === 'warning' ? 'Atenção' : 'Informação');

    const icon = document.createElement('span');
    icon.className = 'app-notification__icon';
    icon.textContent = iconMap[type] || 'i';

    const content = document.createElement('div');
    content.className = 'app-notification__content';

    const strong = document.createElement('strong');
    strong.textContent = titleText;
    const p = document.createElement('p');
    p.textContent = message;

    content.appendChild(strong);
    content.appendChild(p);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'app-notification__close';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 160);
    });

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    window.setTimeout(() => {
        toast.classList.remove('show');
        window.setTimeout(() => toast.remove(), 160);
    }, duration);
}

function setInlineStatus(element, { type = 'loading', message }) {
    if (!element) return;

    element.innerHTML = '';
    const state = document.createElement('div');
    state.className = `status-message ${type}`;

    const icon = document.createElement('span');
    icon.className = type === 'loading' ? 'status-message__spinner' : 'status-message__icon';
    icon.textContent = type === 'loading' ? '' : '•';

    const text = document.createElement('span');
    text.textContent = message;

    state.appendChild(icon);
    state.appendChild(text);
    element.appendChild(state);
}

function setTableStatusMessage(tableBody, { type = 'loading', message }) {
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = `table-status-cell ${type}`;

    const state = document.createElement('div');
    state.className = `status-message ${type}`;
    const icon = document.createElement('span');
    icon.className = type === 'loading' ? 'status-message__spinner' : 'status-message__icon';
    icon.textContent = type === 'loading' ? '' : '•';
    const text = document.createElement('span');
    text.textContent = message;

    state.appendChild(icon);
    state.appendChild(text);
    cell.appendChild(state);
    row.appendChild(cell);
    tableBody.appendChild(row);
}

function setButtonBusy(button, isBusy, label = 'Processando...') {
    if (!button) return;
    button.disabled = isBusy;
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.textContent = isBusy ? label : button.dataset.originalText;
}

function getPortugueseMessage(error, fallback) {
    const message = error?.message || '';
    const normalized = message.toLowerCase();

    if (!message) {
        return fallback;
    }

    if (normalized.includes('failed to fetch') || normalized.includes('networkerror') || normalized.includes('load failed')) {
        return 'Não foi possível conectar ao servidor.';
    }

    if (normalized.includes('not found')) {
        return 'Recurso não encontrado.';
    }

    if (normalized.includes('unauthorized') || normalized.includes('token')) {
        return 'Sessão expirada. Faça login novamente.';
    }

    if (normalized.includes('forbidden')) {
        return 'Você não tem permissão para esta ação.';
    }

    if (normalized.includes('bad request') || normalized.includes('invalid')) {
        return 'Os dados enviados são inválidos.';
    }

    if (normalized.includes('internal server error')) {
        return 'Erro interno do servidor.';
    }

    return message;
}

function updateUserDisplay() {
    const user = getCurrentUser();
    const displayName = user?.name || 'Administrador';
    const userDisplayElements = document.querySelectorAll('#userDisplayName');

    userDisplayElements.forEach((element) => {
        element.textContent = displayName;
    });
}

function attachLogoutHandlers() {
    const logoutLinks = document.querySelectorAll('#logoutModal a[href="login.html"]');
    logoutLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
            window.location.href = 'login.html';
        });
    });
}

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

    function formatAlertOrigin(origin) {
        if (!origin) return 'Sistema';

        const normalized = String(origin).toLowerCase();
        if (normalized.includes('iptables') || normalized.includes('firewall') || normalized.includes('audit')) {
            return 'Auditoria Firewall';
        }
        if (normalized.includes('banco')) return 'Banco';
        if (normalized.includes('simulado')) return 'Simulado';
        if (normalized.includes('sistema')) return 'Sistema';
        return origin;
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

    // --- DASHBOARD DINÂMICO ---
        async function initDashboard() {
            try {
                // Busca dados
                const [alerts, rules] = await Promise.all([
                    fetchAlertsData(),
                    fetchRules()
                ]);

                // Atualiza Card Alertas Críticos
                const critCard = document.querySelector(".text-danger.text-uppercase.mb-1");
                if (critCard) {
                    const critNum = critCard.parentElement.querySelector(".h5");
                    if (critNum) {
                        const highCount = alerts.filter(a => a.severity === "High").length;
                        critNum.textContent = highCount;
                    }
                }

                // Atualiza Card Regras Ativas
                const regrasCard = document.querySelector(".text-success.text-uppercase.mb-1");
                if (regrasCard) {
                    const regrasNum = regrasCard.parentElement.querySelector(".h5");
                    if (regrasNum) {
                        regrasNum.textContent = rules.length;
                    }
                }

                // Atualiza resumo da auditoria de firewall
                const auditSummaryStatus = document.getElementById("auditSummaryStatus");
                const auditSummaryText = document.getElementById("auditSummaryText");
                try {
                    const audit = await fetchIptablesAudit();
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

                            // Atualiza tabela Alertas Recentes
                const alertRows = buildDashboardAlerts(alerts, await fetchIptablesAudit());
                const alertsTableBody = document.getElementById("dashboardAlertsTableBody");
                if (alertsTableBody) {
                    alertsTableBody.innerHTML = "";
                    if (!alertRows.length) {
                        setTableStatusMessage(alertsTableBody, { type: 'info', message: 'Nenhum alerta recente encontrado.' });
                    } else {
                        alertRows.forEach(alert => {
                            const tr = document.createElement("tr");
                            const tdId = document.createElement("td");
                            tdId.textContent = alert.id;
                            tr.appendChild(tdId);

                            const tdTs = document.createElement("td");
                            tdTs.textContent = alert.timestamp;
                            tr.appendChild(tdTs);

                            const tdType = document.createElement("td");
                            tdType.textContent = alert.type;
                            tr.appendChild(tdType);

                            const tdOrigin = document.createElement("td");
                            tdOrigin.textContent = formatAlertOrigin(alert.origin);
                            tr.appendChild(tdOrigin);

                            const tdDesc = document.createElement("td");
                            tdDesc.textContent = alert.description;
                            tr.appendChild(tdDesc);

                            const tdSev = document.createElement("td");
                            const span = document.createElement("span");
                            span.textContent = alert.severity;
                            if (alert.severity === "High") span.classList.add("badge", "badge-danger");
                            else if (alert.severity === "Medium") span.classList.add("badge", "badge-warning");
                            else span.classList.add("badge", "badge-success");
                            tdSev.appendChild(span);
                            tr.appendChild(tdSev);

                            alertsTableBody.appendChild(tr);
                        });
                    }
                }

                // Atualiza tabela Regras Rápidas
                const rulesTable = document.getElementById("dashboardRulesTable");
                if (rulesTable) {
                    const tbody = rulesTable.querySelector("tbody");
                    if (tbody) {
                        tbody.innerHTML = "";
                        rules.slice(0, 3).forEach(rule => {
                            const tr = document.createElement("tr");
                            // ID
                            const tdId = document.createElement("td");
                            tdId.textContent = rule.id;
                            tr.appendChild(tdId);
                            // Nome
                            const tdName = document.createElement("td");
                            tdName.textContent = rule.name;
                            tr.appendChild(tdName);
                            // Ação
                            const tdAction = document.createElement("td");
                            tdAction.textContent = rule.action;
                            tr.appendChild(tdAction);
                            tbody.appendChild(tr);
                        });
                    }
                }
            } catch (error) {
                showNotification({ type: 'error', title: 'Erro no dashboard', message: getPortugueseMessage(error, 'Não foi possível carregar o dashboard.') });
            }
        }
    // --- INTEGRAÇÃO MONITORAMENTO ---
    let alertsTrafficChart = null;
    let alertsSeverityChart = null;
    let alertsChartsRefreshTimer = null;

    function resetChartState(canvasId, message) {
        const canvas = document.getElementById(canvasId);
        const messageEl = document.getElementById(`${canvasId}Message`);
        if (canvas) {
            canvas.style.display = message ? 'none' : 'block';
        }
        if (messageEl) {
            messageEl.textContent = message || '';
        }
    }

    function destroyAlertsCharts() {
        if (alertsTrafficChart) {
            alertsTrafficChart.destroy();
            alertsTrafficChart = null;
        }
        if (alertsSeverityChart) {
            alertsSeverityChart.destroy();
            alertsSeverityChart = null;
        }
    }

    async function renderAlertsCharts() {
        if (!window.location.pathname.endsWith('alerts.html')) return;

        const lineCanvas = document.getElementById('lineChart');
        const pieCanvas = document.getElementById('pieChart');
        if (!lineCanvas || !pieCanvas) return;

        resetChartState('lineChart', 'Carregando gráfico de tráfego...');
        resetChartState('pieChart', 'Carregando distribuição de ameaças...');

        if (!window.Chart) {
            resetChartState('lineChart', 'A biblioteca de gráficos não está disponível.');
            resetChartState('pieChart', 'A biblioteca de gráficos não está disponível.');
            showNotification({ type: 'warning', title: 'Gráfico indisponível', message: 'Não foi possível renderizar os gráficos no momento.' });
            return;
        }

        try {
            const alertsData = await fetchAlertsData();
            const alerts = Array.isArray(alertsData) ? alertsData : [];

            destroyAlertsCharts();

            const timeSeries = alerts.reduce((acc, alert) => {
                const date = new Date(alert.timestamp || new Date().toISOString());
                if (Number.isNaN(date.getTime())) return acc;
                const label = `${String(date.getHours()).padStart(2, '0')}:00`;
                acc[label] = (acc[label] || 0) + 1;
                return acc;
            }, {});

            const chartLabels = Object.keys(timeSeries).sort();
            const chartValues = chartLabels.map((label) => timeSeries[label]);

            if (chartLabels.length && chartValues.length) {
                alertsTrafficChart = new window.Chart(lineCanvas, {
                    type: 'line',
                    data: {
                        labels: chartLabels,
                        datasets: [{
                            label: 'Alertas',
                            data: chartValues,
                            borderColor: '#4e73df',
                            backgroundColor: 'rgba(78,115,223,0.08)',
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
                resetChartState('lineChart');
            } else {
                resetChartState('lineChart', 'Nenhum dado de alertas disponível no momento.');
            }

            const severityCounts = alerts.reduce((acc, alert) => {
                const severity = String(alert?.severity || 'Unknown').trim();
                if (!severity || severity === 'Unknown') {
                    return acc;
                }
                acc[severity] = (acc[severity] || 0) + 1;
                return acc;
            }, {});

            const severityLabels = Object.keys(severityCounts);
            const severityValues = severityLabels.map((label) => severityCounts[label]);
            const severityColors = {
                High: '#e74a3b',
                Medium: '#f6c23e',
                Low: '#36b9cc'
            };

            if (severityLabels.length && severityValues.some((value) => value > 0)) {
                alertsSeverityChart = new window.Chart(pieCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: severityLabels,
                        datasets: [{
                            data: severityValues,
                            backgroundColor: severityLabels.map((label) => severityColors[label] || '#858796')
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
                resetChartState('pieChart');
            } else {
                resetChartState('pieChart', 'Nenhum alerta cadastrado para exibir a distribuição.');
            }
        } catch (error) {
            destroyAlertsCharts();
            resetChartState('lineChart', 'Não foi possível carregar o gráfico de tráfego.');
            resetChartState('pieChart', 'Não foi possível carregar a distribuição de ameaças.');
            showNotification({ type: 'error', title: 'Erro ao carregar gráficos', message: getPortugueseMessage(error, 'Não foi possível carregar os gráficos.') });
        }
    }

    function startAlertsChartsRefresh() {
        if (alertsChartsRefreshTimer) {
            window.clearInterval(alertsChartsRefreshTimer);
        }

        alertsChartsRefreshTimer = window.setInterval(() => {
            if (window.location.pathname.endsWith('alerts.html')) {
                renderAlertsCharts();
            }
        }, 30000);
    }

    async function renderTrafficChart() {
    const ctx = document.getElementById("trafficChart");
    if (!ctx) return;

    const chartContainer = document.querySelector('.chart-area');
    if (chartContainer) {
        chartContainer.innerHTML = '<div class="text-muted p-3">Carregando gráfico...</div>';
    }

    try {
        if (!window.Chart) {
            throw new Error('Biblioteca de gráficos indisponível.');
        }

        const rawData = await fetchTrafficData();
        const chartLabels = Array.isArray(rawData?.labels) && rawData.labels.length ? rawData.labels : ['Sem dados'];
        const chartData = Array.isArray(rawData?.data) && rawData.data.length ? rawData.data : [0];

        const labels = chartLabels.slice(0, 12);
        const data = chartData.slice(0, 12);
        const normalizedData = data.length < labels.length ? [...data, ...Array(labels.length - data.length).fill(0)] : data;

        if (chartContainer) {
            chartContainer.innerHTML = '';
            chartContainer.appendChild(ctx);
        }

        new window.Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tráfego',
                    data: normalizedData,
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78,115,223,0.05)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: true },
                    y: { display: true }
                }
            }
        });
    } catch (error) {
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="text-muted p-3">Não foi possível renderizar o gráfico no momento.</div>';
        }
        showNotification({ type: 'error', title: 'Erro no gráfico', message: getPortugueseMessage(error, 'Não foi possível carregar o gráfico.') });
    }
}
    async function renderRecentLogsSidebar() {
        const listGroup = document.querySelector('.list-group.list-group-flush');
        if (!listGroup) return;

        listGroup.innerHTML = '';
        setInlineStatus(listGroup, { type: 'loading', message: 'Carregando logs recentes...' });

        try {
            const logs = await fetchAlertsData();
            const items = Array.isArray(logs) ? logs.slice(0, 6) : [];

            listGroup.innerHTML = '';

            if (!items.length) {
                listGroup.innerHTML = '<div class="text-muted p-2">Nenhum log recente no momento.</div>';
                return;
            }

            items.forEach(log => {
                const a = document.createElement('a');
                a.href = "#";
                a.classList.add('list-group-item', 'list-group-item-action');

                const divTop = document.createElement('div');
                divTop.classList.add('d-flex', 'w-100', 'justify-content-between');

                const h6 = document.createElement('h6');
                h6.classList.add('mb-1');
                h6.textContent = log.type || 'Log';

                const badge = document.createElement('span');
                badge.classList.add('badge', 'badge-pill');
                if (String(log.origin).toLowerCase() === 'iptables') {
                    badge.classList.add('badge-primary');
                    badge.textContent = 'Firewall';
                } else {
                    badge.classList.add('badge-secondary');
                    badge.textContent = 'Interno';
                }

                const leftGroup = document.createElement('div');
                leftGroup.classList.add('d-flex', 'w-100', 'justify-content-between');
                leftGroup.appendChild(h6);
                leftGroup.appendChild(badge);

                const smallTime = document.createElement('small');
                    if (log.timestamp) {
                        const date = new Date(log.timestamp);
                        smallTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } else {
                        smallTime.textContent = "-";
                    }

                divTop.appendChild(leftGroup);
                divTop.appendChild(smallTime);

                const p = document.createElement('p');
                p.classList.add('mb-1');
                if (log.description) {
                    p.textContent = log.description;
                } else if (log.details) {
                    p.textContent = log.details;
                } else {
                    p.textContent = "-";
                }

                const smallSev = document.createElement('small');
                smallSev.classList.add('text-muted');
                smallSev.textContent = `Severidade: ${log.severity || '-'}`;

                a.appendChild(divTop);
                a.appendChild(p);
                a.appendChild(smallSev);
                listGroup.appendChild(a);
            });
        } catch (error) {
            listGroup.innerHTML = '';
            setInlineStatus(listGroup, { type: 'error', message: getPortugueseMessage(error, 'Erro ao carregar logs recentes.') });
        }
    }
document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').filter(Boolean).pop() || 'index.html';
    const isRootPage = currentPath === '/' || currentPath.endsWith('/');
    const pageName = isRootPage ? 'index.html' : currentPage;
    const protectedPages = ['index.html', 'alerts.html', 'rules.html', 'monitoring.html'];

    if (protectedPages.includes(pageName) && !isAuthenticated()) {
        window.location.replace('login.html');
        return;
    }

    attachLogoutHandlers();
    updateUserDisplay();

    const downloadFile = (filename, content, mimeType = "text/csv;charset=utf-8;") => {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const tableToCsv = (table) => {
        const rows = Array.from(table.querySelectorAll("thead tr, tbody tr"));
        const csv = rows.map(row => {
            const cells = Array.from(row.querySelectorAll("th, td"));
            return cells.map(cell => `"${cell.innerText.replace(/"/g, '""')}"`).join(",");
        }).join("\n");
        return csv;
    };



    let currentRuleForEdit = null;
    let pendingRuleRemoval = null;

    function resetRuleForm() {
        const nameInput = document.getElementById("ruleName");
        const conditionInput = document.getElementById("ruleCondition");
        const actionInput = document.getElementById("ruleAction");
        const ruleIdInput = document.getElementById("ruleId");
        if (nameInput) nameInput.value = "";
        if (conditionInput) conditionInput.value = "";
        if (actionInput) actionInput.value = "Alert";
        if (ruleIdInput) ruleIdInput.value = "";
        currentRuleForEdit = null;
    }

    function openRuleModal(rule = null) {
        const modal = document.getElementById("addRuleModal");
        const title = document.getElementById("addRuleModalLabel");
        const nameInput = document.getElementById("ruleName");
        const conditionInput = document.getElementById("ruleCondition");
        const actionInput = document.getElementById("ruleAction");
        const ruleIdInput = document.getElementById("ruleId");
        const saveButton = document.getElementById("saveRuleBtn");

        if (!modal || !title || !nameInput || !conditionInput || !actionInput || !ruleIdInput || !saveButton) {
            return;
        }

        currentRuleForEdit = rule || null;
        ruleIdInput.value = rule ? String(rule.id) : "";
        nameInput.value = rule?.name || "";
        conditionInput.value = rule?.condition || "";
        actionInput.value = rule?.action || "Alert";
        title.textContent = rule ? "Editar Regra" : "Adicionar Nova Regra";
        saveButton.textContent = rule ? "Salvar Alterações" : "Salvar Regra";

        if (window.$) {
            window.$(modal).modal("show");
        }
    }

    function showRemoveRuleConfirm(rule) {
        const modal = document.getElementById("confirmRuleDeleteModal");
        const message = document.getElementById("confirmRuleDeleteMessage");
        if (!modal || !message) {
            return;
        }

        pendingRuleRemoval = rule;
        message.textContent = `Deseja remover a regra "${rule?.name || "esta regra"}"?`;

        if (window.$) {
            window.$(modal).modal("show");
        }
    }

async function renderRulesTable() {
    const tableBody = document.querySelector("#rulesTable tbody");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    setTableStatusMessage(tableBody, { type: 'loading', message: 'Carregando regras...' });

    try {
        const rules = await fetchRules();

        tableBody.innerHTML = "";

        if (!rules || rules.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='6' class='text-center'>Nenhuma regra cadastrada.</td></tr>";
            return;
        }

        rules.forEach(rule => {
            const tr = document.createElement("tr");

            // ID
            const tdId = document.createElement("td");
            tdId.textContent = rule.id;
            tr.appendChild(tdId);

            // Nome
            const tdName = document.createElement("td");
            tdName.textContent = rule.name;
            tr.appendChild(tdName);

            // Condição
            const tdCond = document.createElement("td");
            tdCond.textContent = rule.condition;
            tr.appendChild(tdCond);

            // Ação
            const tdAction = document.createElement("td");
            tdAction.textContent = rule.action;
            tr.appendChild(tdAction);

            // Status (Lógica de Badge)
            const tdStatus = document.createElement("td");
            const span = document.createElement("span");

            const statusValue = String(rule.status || 'Inativa').trim();
            const isActive = statusValue.toLowerCase() === 'ativa' || statusValue.toLowerCase() === 'active';
            span.textContent = statusValue;
            span.classList.add("badge", isActive ? "badge-success" : "badge-secondary");
            tdStatus.appendChild(span);
            tr.appendChild(tdStatus);

            // Coluna de Botões
            const tdBtns = document.createElement("td");

            // Editar (PATCH)
            const btnEdit = document.createElement("button");
            btnEdit.textContent = "Editar";
            btnEdit.classList.add("btn", "btn-sm", "btn-outline-warning", "mr-1");
            btnEdit.addEventListener("click", () => openRuleModal(rule));
            tdBtns.appendChild(btnEdit);

            // Alternar Status (PUT/PATCH)
            const btnToggle = document.createElement("button");
            btnToggle.textContent = isActive ? "Desativar" : "Ativar";
            btnToggle.classList.add("btn", "btn-sm", isActive ? "btn-danger" : "btn-success", "mr-1");
            btnToggle.onclick = async () => {
                try {
                    await updateRuleStatus(rule.id, isActive ? "Inativa" : "Ativa");
                    renderRulesTable();
                    showNotification({ type: 'success', title: 'Status atualizado', message: `Regra ${isActive ? 'desativada' : 'ativada'} com sucesso.` });
                } catch (error) {
                    showNotification({ type: 'error', title: 'Erro ao alterar status', message: getPortugueseMessage(error, 'Não foi possível alterar o status da regra.') });
                }
            };
            tdBtns.appendChild(btnToggle);

            // Remover (DELETE)
            const btnRemove = document.createElement("button");
            btnRemove.textContent = "Remover";
            btnRemove.classList.add("btn", "btn-sm", "btn-outline-danger");
            btnRemove.addEventListener("click", () => showRemoveRuleConfirm(rule));
            tdBtns.appendChild(btnRemove);

            tr.appendChild(tdBtns);
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao renderizar tabela:", error);
        setTableStatusMessage(tableBody, { type: 'error', message: getPortugueseMessage(error, 'Erro ao conectar com o servidor.') });
        showNotification({ type: 'error', title: 'Erro ao carregar regras', message: getPortugueseMessage(error, 'Erro ao conectar com o servidor.') });
    }
}

    const showFakeSearch = (input) => {
        const query = input.value.trim();
        if (!query) {
            showNotification({ type: 'warning', title: 'Busca vazia', message: 'Digite um termo para buscar.' });
            return;
        }
        showNotification({ type: 'info', title: 'Busca simulada', message: `Resultados falsos encontrados para "${query}".` });
    };


    // Variável para armazenar alertas carregados da API
    let currentAlerts = [];

    // Função assíncrona para buscar alertas da API
    async function fetchAlerts() {
        const tableBody = document.querySelector("#alertsListTable tbody");
        if (tableBody) {
            setTableStatusMessage(tableBody, { type: 'loading', message: 'Carregando alertas...' });
        }

        try {
            const data = await fetchAlertsData();
            currentAlerts = Array.isArray(data) ? data.map((alert) => ({
                ...alert,
                origin: alert.origin ? alert.origin : 'Banco'
            })) : [];

            const severityPriority = { high: 0, medium: 1, low: 2, info: 3 };
            currentAlerts.sort((a, b) => {
                const aSeverity = severityPriority[String(a.severity || '').toLowerCase()] ?? 4;
                const bSeverity = severityPriority[String(b.severity || '').toLowerCase()] ?? 4;
                if (aSeverity !== bSeverity) return aSeverity - bSeverity;
                const aOrigin = String(a.origin || '').toLowerCase();
                const bOrigin = String(b.origin || '').toLowerCase();
                if (aOrigin !== bOrigin) {
                    return aOrigin === 'auditoria firewall' ? -1 : bOrigin === 'auditoria firewall' ? 1 : 0;
                }
                return String(b.timestamp || '').localeCompare(String(a.timestamp || ''));
            });
        } catch (error) {
            currentAlerts = [];
            if (tableBody) {
                setTableStatusMessage(tableBody, { type: 'error', message: error.message || 'Falha ao carregar alertas.' });
            }
            showNotification({ type: 'error', title: 'Erro ao carregar alertas', message: getPortugueseMessage(error, 'Falha ao carregar alertas.') });
        }
    }

    const parseAlertDate = (timestamp) => {
        const date = new Date(timestamp);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const getFilterValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : null;
    };


    function filterAlerts() {
        const severity = getFilterValue("severityFilter");
        const type = getFilterValue("typeFilter");
        const from = getFilterValue("dateFromFilter");
        const to = getFilterValue("dateToFilter");
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : null;

        return currentAlerts.filter(alert => {
            if (severity && severity !== "all" && alert.severity !== severity) {
                return false;
            }
            if (type && type !== "all" && alert.type !== type) {
                return false;
            }
            const alertDate = parseAlertDate(alert.timestamp);
            if (fromDate && alertDate && alertDate < fromDate) {
                return false;
            }
            if (toDate && alertDate && alertDate > toDate) {
                return false;
            }
            return true;
        });
    }


    function renderAlertsTable(alerts) {
        const tableBody = document.querySelector("#alertsListTable tbody");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        alerts.forEach(alert => {
            const tr = document.createElement("tr");

            // ID
            const tdId = document.createElement("td");
            tdId.textContent = alert.id;
            tr.appendChild(tdId);

            // Timestamp
            const tdTimestamp = document.createElement("td");
            tdTimestamp.textContent = alert.timestamp;
            tr.appendChild(tdTimestamp);

            // Tipo
            const tdType = document.createElement("td");
            tdType.textContent = alert.type;
            tr.appendChild(tdType);

            // Origem
            const tdOrigin = document.createElement("td");
            tdOrigin.textContent = formatAlertOrigin(alert.origin);
            tr.appendChild(tdOrigin);

            // Descrição
            const tdDesc = document.createElement("td");
            tdDesc.textContent = alert.description;
            tr.appendChild(tdDesc);

            // Severidade
            const tdSev = document.createElement("td");
            const span = document.createElement("span");
            span.textContent = alert.severity;
            if (alert.severity === "High") {
                span.classList.add("badge", "badge-danger");
            } else if (alert.severity === "Medium") {
                span.classList.add("badge", "badge-warning");
            } else {
                span.classList.add("badge", "badge-success");
            }
            tdSev.appendChild(span);
            tr.appendChild(tdSev);

            // Status
            const tdStatus = document.createElement("td");
            tdStatus.textContent = alert.status;
            tr.appendChild(tdStatus);

            // Botão Detalhes
            const tdBtn = document.createElement("td");
            const btn = document.createElement("button");
            btn.textContent = "Detalhes";
            btn.classList.add("btn", "btn-sm", "btn-info", "alert-details-btn");
            btn.addEventListener("click", () => {
                showNotification({
                    type: 'info',
                    title: `Alerta ${alert.id}`,
                    message: `${alert.type} • ${alert.description}`
                });
            });
            tdBtn.appendChild(btn);
            tr.appendChild(tdBtn);

            tableBody.appendChild(tr);
        });
    }


    function updateAlertFilters() {
        renderAlertsTable(filterAlerts());
    }

    const getTableData = (tableId) => {
        const table = document.getElementById(tableId);
        return table ? tableToCsv(table) : null;
    };

    const handleGenerateReport = (event) => {
        event.preventDefault();
        const data = getTableData("dashboardAlertsTable");
        if (!data) {
            showNotification({ type: 'warning', title: 'Relatório', message: 'Não há dados de dashboard para gerar relatório.' });
            return;
        }
        downloadFile("relatorio-dashboard.csv", data);
    };

    const handleExportAlerts = (event) => {
        event.preventDefault();
        const data = getTableData("alertsListTable");
        if (!data) {
            showNotification({ type: 'warning', title: 'Exportação', message: 'Não há alertas para exportar.' });
            return;
        }
        downloadFile("alertas-export.csv", data);
    };

    const handleExportLogs = (event) => {
        event.preventDefault();
        const logs = currentAlerts.length ? currentAlerts : [
            {
                id: 1,
                timestamp: '2026-03-15 10:00:00',
                origin: '192.168.1.10',
                type: 'Tráfego suspeito',
                severity: 'High',
                status: 'OK'
            },
            {
                id: 2,
                timestamp: '2026-03-15 10:05:32',
                origin: '10.0.0.5',
                type: 'Port Scan',
                severity: 'Medium',
                status: 'Bloqueado'
            }
        ];

        const rows = [
            ["ID", "Timestamp", "Origem", "Tipo", "Severidade", "Status"],
            ...logs.map(log => [
                String(log.id || ''),
                String(log.timestamp || ''),
                formatAlertOrigin(log.origin),
                String(log.type || ''),
                String(log.severity || ''),
                String(log.status || '')
            ])
        ];

        const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        downloadFile("logs-export.csv", csv);
    };


    async function handleSaveRule() {
        const name = document.getElementById("ruleName").value.trim();
        const condition = document.getElementById("ruleCondition").value.trim();
        const action = document.getElementById("ruleAction").value.trim();
        const ruleId = document.getElementById("ruleId").value;

        if (!name || !condition) {
            showNotification({ type: 'warning', title: 'Validação', message: 'Preencha o nome e a condição da regra antes de salvar.' });
            return;
        }

        const isEditing = Boolean(ruleId);
        const payload = {
            name,
            condition,
            action,
            status: currentRuleForEdit?.status || "Ativa"
        };
        setButtonBusy(saveRuleBtn, true, isEditing ? 'Salvando...' : 'Salvando...');
        try {
            const saved = isEditing ? await updateRule(Number(ruleId), payload) : await createRule(payload);
            if (saved) {
                renderRulesTable();
                resetRuleForm();
                if (window.$) {
                    window.$("#addRuleModal").modal("hide");
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

    // Funções handleRuleAction e handleRemoveRule removidas pois agora os eventos são atrelados diretamente na renderização dinâmica

    const handleAlertDetails = (button) => {
        const row = button.closest("tr");
        if (!row) {
            return;
        }
        const cells = Array.from(row.querySelectorAll("td")).map(cell => cell.innerText.trim());
        showNotification({
            type: 'info',
            title: `Alerta ${cells[0]}`,
            message: `${cells[2]} • ${cells[3]}`
        });
    };

    const generateReportBtn = document.getElementById("generateReportBtn");
    if (generateReportBtn) {
        generateReportBtn.addEventListener("click", handleGenerateReport);
    }

    const exportAlertsBtn = document.getElementById("exportAlertsBtn");
    if (exportAlertsBtn) {
        exportAlertsBtn.addEventListener("click", handleExportAlerts);
    }

    const exportLogsBtn = document.getElementById("exportLogsBtn");
    if (exportLogsBtn) {
        exportLogsBtn.addEventListener("click", handleExportLogs);
    }

    const saveRuleBtn = document.getElementById("saveRuleBtn");
    if (saveRuleBtn) {
        saveRuleBtn.addEventListener("click", handleSaveRule);
    }

    const confirmDeleteRuleBtn = document.getElementById("confirmDeleteRuleBtn");
    if (confirmDeleteRuleBtn) {
        confirmDeleteRuleBtn.addEventListener("click", async () => {
            if (!pendingRuleRemoval) return;
            try {
                await deleteRule(pendingRuleRemoval.id);
                pendingRuleRemoval = null;
                renderRulesTable();
                if (window.$) {
                    window.$("#confirmRuleDeleteModal").modal("hide");
                }
                showNotification({ type: 'success', title: 'Regra removida', message: 'Regra removida com sucesso.' });
            } catch (error) {
                showNotification({ type: 'error', title: 'Erro ao remover regra', message: getPortugueseMessage(error, 'Não foi possível remover a regra.') });
            }
        });
    }

    document.querySelectorAll(".navbar-search").forEach((form) => {
        const input = form.querySelector("input[type=text], input[type=search]");
        const button = form.querySelector("button");
        if (button && input) {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                showFakeSearch(input);
            });
        }
    });


    // Função de inicialização dos alertas
    async function initAlerts() {
        await fetchAlerts();
        renderAlertsTable(filterAlerts());
        if (window.location.pathname.endsWith('alerts.html')) {
            await renderAlertsCharts();
            startAlertsChartsRefresh();
        }
    }

    const severityFilter = document.getElementById("severityFilter");
    const typeFilter = document.getElementById("typeFilter");
    const dateFromFilter = document.getElementById("dateFromFilter");
    const dateToFilter = document.getElementById("dateToFilter");

    if (severityFilter) {
        severityFilter.addEventListener("change", updateAlertFilters);
    }
    if (typeFilter) {
        typeFilter.addEventListener("change", updateAlertFilters);
    }
    if (dateFromFilter) {
        dateFromFilter.addEventListener("change", updateAlertFilters);
    }
    if (dateToFilter) {
        dateToFilter.addEventListener("change", updateAlertFilters);
    }



    // Inicialização específica para página de monitoramento e dashboard
    if (window.location.pathname.endsWith("monitoring.html")) {
        renderTrafficChart();
        renderRecentLogsSidebar();
    }
    if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
        initDashboard();
    }

    // Inicializa alertas ao carregar a página
    initAlerts();


    renderRulesTable();

    document.querySelectorAll("a.dropdown-item[href='#']:not([data-toggle])").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const action = link.innerText.trim();
            showNotification({ type: 'info', title: 'Funcionalidade simulada', message: `Ação de menu: ${action}.` });
        });
    });

    // Logs buttons
    document.querySelectorAll('.block-ip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showNotification({ type: 'success', title: 'IP bloqueado', message: 'IP bloqueado com sucesso!' });
        });
    });
    document.querySelectorAll('.investigate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showNotification({ type: 'info', title: 'Investigação iniciada', message: 'Resultados: nenhuma ameaça adicional encontrada.' });
        });
    });
});
