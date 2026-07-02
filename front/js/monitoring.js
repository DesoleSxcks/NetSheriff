// Página de monitoramento (monitoring.html): gráfico de tráfego, sidebar de
// logs recentes com busca e exportação de logs em CSV.

import { fetchTrafficData, fetchAlertsData } from './api.js';
import { showNotification, setInlineStatus, getPortugueseMessage, formatAlertOrigin, matchesQuery, downloadFile } from './utils.js';
import { registerSearchFilter, getSearchQuery } from './search.js';

let currentLogs = [];
let logsSearchQuery = '';

async function renderTrafficChart() {
    const ctx = document.getElementById('trafficChart');
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

function filterLogs(query) {
    return currentLogs.filter((log) => matchesQuery([
        log.type,
        formatAlertOrigin(log.origin),
        log.origin,
        log.description,
        log.details,
        log.severity,
        log.status
    ], query));
}

function renderRecentLogsList(items) {
    const listGroup = document.querySelector('.list-group.list-group-flush');
    if (!listGroup) return;

    listGroup.innerHTML = '';

    if (!items.length) {
        const searching = Boolean(logsSearchQuery);
        listGroup.innerHTML = `<div class="text-muted p-2">${searching ? 'Nenhum resultado encontrado.' : 'Nenhum log recente no momento.'}</div>`;
        return;
    }

    items.forEach(log => {
        const a = document.createElement('a');
        a.href = '#';
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
            smallTime.textContent = '-';
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
            p.textContent = '-';
        }

        const smallSev = document.createElement('small');
        smallSev.classList.add('text-muted');
        smallSev.textContent = `Severidade: ${log.severity || '-'}`;

        a.appendChild(divTop);
        a.appendChild(p);
        a.appendChild(smallSev);
        listGroup.appendChild(a);
    });
}

function applyLogsSearch(query) {
    logsSearchQuery = query;
    renderRecentLogsList(filterLogs(query).slice(0, 6));
}

async function loadRecentLogs() {
    const listGroup = document.querySelector('.list-group.list-group-flush');
    if (!listGroup) return;

    listGroup.innerHTML = '';
    setInlineStatus(listGroup, { type: 'loading', message: 'Carregando logs recentes...' });

    try {
        const logs = await fetchAlertsData();
        currentLogs = Array.isArray(logs) ? logs : [];
        logsSearchQuery = getSearchQuery();
        renderRecentLogsList(filterLogs(logsSearchQuery).slice(0, 6));
    } catch (error) {
        currentLogs = [];
        listGroup.innerHTML = '';
        setInlineStatus(listGroup, { type: 'error', message: getPortugueseMessage(error, 'Erro ao carregar logs recentes.') });
    }
}

function handleExportLogs(event) {
    event.preventDefault();
    const logs = currentLogs.length ? currentLogs : [
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
        ['ID', 'Timestamp', 'Origem', 'Tipo', 'Severidade', 'Status'],
        ...logs.map(log => [
            String(log.id || ''),
            String(log.timestamp || ''),
            formatAlertOrigin(log.origin),
            String(log.type || ''),
            String(log.severity || ''),
            String(log.status || '')
        ])
    ];

    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile('logs-export.csv', csv);
}

export function initMonitoringPage() {
    if (!document.getElementById('trafficChart')) {
        return;
    }

    const exportLogsBtn = document.getElementById('exportLogsBtn');
    if (exportLogsBtn) {
        exportLogsBtn.addEventListener('click', handleExportLogs);
    }

    registerSearchFilter(applyLogsSearch);
    renderTrafficChart();
    loadRecentLogs();
}
