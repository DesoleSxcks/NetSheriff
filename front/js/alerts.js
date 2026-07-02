// Página de alertas (alerts.html): lista de alertas com filtros e busca,
// gráficos de tráfego/severidade e exportação em CSV.

import { fetchAlertsData } from './api.js';
import { showNotification, setTableStatusMessage, getPortugueseMessage, formatAlertOrigin, matchesQuery, downloadFile, tableToCsv } from './utils.js';
import { registerSearchFilter, getSearchQuery, filterTableRows } from './search.js';

const ALERTS_TABLE_COLUMNS = 8;

let currentAlerts = [];
let alertsSearchQuery = '';
let alertsTrafficChart = null;
let alertsSeverityChart = null;
let alertsChartsRefreshTimer = null;

function getAlertsTableBody() {
    return document.querySelector('#alertsListTable tbody');
}

async function fetchAlerts() {
    const tableBody = getAlertsTableBody();
    if (tableBody) {
        setTableStatusMessage(tableBody, { type: 'loading', message: 'Carregando alertas...', colSpan: ALERTS_TABLE_COLUMNS });
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
            setTableStatusMessage(tableBody, { type: 'error', message: error.message || 'Falha ao carregar alertas.', colSpan: ALERTS_TABLE_COLUMNS });
        }
        showNotification({ type: 'error', title: 'Erro ao carregar alertas', message: getPortugueseMessage(error, 'Falha ao carregar alertas.') });
    }
}

function parseAlertDate(timestamp) {
    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getFilterValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : null;
}

function filterAlerts() {
    const severity = getFilterValue('severityFilter');
    const type = getFilterValue('typeFilter');
    const from = getFilterValue('dateFromFilter');
    const to = getFilterValue('dateToFilter');
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : null;

    return currentAlerts.filter(alert => {
        if (severity && severity !== 'all' && alert.severity !== severity) {
            return false;
        }
        if (type && type !== 'all' && alert.type !== type) {
            return false;
        }
        const alertDate = parseAlertDate(alert.timestamp);
        if (fromDate && alertDate && alertDate < fromDate) {
            return false;
        }
        if (toDate && alertDate && alertDate > toDate) {
            return false;
        }
        if (!matchesQuery([
            alert.id,
            alert.timestamp,
            alert.type,
            formatAlertOrigin(alert.origin),
            alert.description,
            alert.severity,
            alert.status
        ], alertsSearchQuery)) {
            return false;
        }
        return true;
    });
}

function renderAlertsTable(alerts) {
    const tableBody = getAlertsTableBody();
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!alerts.length) {
        const searching = Boolean(alertsSearchQuery);
        setTableStatusMessage(tableBody, {
            type: 'info',
            message: searching ? 'Nenhum resultado encontrado.' : 'Nenhum alerta encontrado.',
            colSpan: ALERTS_TABLE_COLUMNS
        });
        return;
    }

    alerts.forEach(alert => {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.textContent = alert.id;
        tr.appendChild(tdId);

        const tdTimestamp = document.createElement('td');
        tdTimestamp.textContent = alert.timestamp;
        tr.appendChild(tdTimestamp);

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
        if (alert.severity === 'High') {
            span.classList.add('badge', 'badge-danger');
        } else if (alert.severity === 'Medium') {
            span.classList.add('badge', 'badge-warning');
        } else {
            span.classList.add('badge', 'badge-success');
        }
        tdSev.appendChild(span);
        tr.appendChild(tdSev);

        const tdStatus = document.createElement('td');
        tdStatus.textContent = alert.status;
        tr.appendChild(tdStatus);

        const tdBtn = document.createElement('td');
        const btn = document.createElement('button');
        btn.textContent = 'Detalhes';
        btn.classList.add('btn', 'btn-sm', 'btn-info', 'alert-details-btn');
        btn.addEventListener('click', () => {
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

// Busca da barra superior: filtra a lista de alertas e também a tabela
// estática de "Logs de Segurança" da página.
function applyAlertsSearch(query) {
    alertsSearchQuery = query;
    updateAlertFilters();

    document.querySelectorAll('table.table-hover').forEach((table) => {
        filterTableRows(table, query);
    });
}

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

function handleExportAlerts(event) {
    event.preventDefault();
    const table = document.getElementById('alertsListTable');
    const data = table ? tableToCsv(table) : null;
    if (!data) {
        showNotification({ type: 'warning', title: 'Exportação', message: 'Não há alertas para exportar.' });
        return;
    }
    downloadFile('alertas-export.csv', data);
}

function attachAlertFilterListeners() {
    ['severityFilter', 'typeFilter', 'dateFromFilter', 'dateToFilter'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateAlertFilters);
        }
    });
}

export function initAlertsPage() {
    if (!document.getElementById('alertsListTable')) {
        return;
    }

    const exportAlertsBtn = document.getElementById('exportAlertsBtn');
    if (exportAlertsBtn) {
        exportAlertsBtn.addEventListener('click', handleExportAlerts);
    }

    attachAlertFilterListeners();
    registerSearchFilter(applyAlertsSearch);

    (async () => {
        await fetchAlerts();
        alertsSearchQuery = getSearchQuery();
        updateAlertFilters();
        if (window.location.pathname.endsWith('alerts.html')) {
            await renderAlertsCharts();
            startAlertsChartsRefresh();
        }
    })();
}
