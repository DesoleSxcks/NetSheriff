import { fetchRules, createRule, updateRuleStatus, updateRuleName, deleteRule, fetchAlertsData, fetchTrafficData } from './api.js';

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

                // Atualiza tabela Alertas Recentes
                const alertsTable = document.getElementById("dashboardAlertsTable");
                if (alertsTable) {
                    const tbody = alertsTable.querySelector("tbody");
                    if (tbody) {
                        tbody.innerHTML = "";
                        alerts.slice(-3).reverse().forEach(alert => {
                            const tr = document.createElement("tr");
                            // ID
                            const tdId = document.createElement("td");
                            tdId.textContent = alert.id;
                            tr.appendChild(tdId);
                            // Timestamp
                            const tdTs = document.createElement("td");
                            tdTs.textContent = alert.timestamp;
                            tr.appendChild(tdTs);
                            // Tipo
                            const tdType = document.createElement("td");
                            tdType.textContent = alert.type;
                            tr.appendChild(tdType);
                            // Descrição
                            const tdDesc = document.createElement("td");
                            tdDesc.textContent = alert.description;
                            tr.appendChild(tdDesc);
                            // Severidade
                            const tdSev = document.createElement("td");
                            const span = document.createElement("span");
                            span.textContent = alert.severity;
                            if (alert.severity === "High") span.classList.add("badge", "badge-danger");
                            else if (alert.severity === "Medium") span.classList.add("badge", "badge-warning");
                            else span.classList.add("badge", "badge-success");
                            tdSev.appendChild(span);
                            tr.appendChild(tdSev);
                            tbody.appendChild(tr);
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
                alert("Falha ao carregar dashboard: " + error.message);
            }
        }
    // --- INTEGRAÇÃO MONITORAMENTO ---
    async function renderTrafficChart() {
        const ctx = document.getElementById("trafficChart");
        if (!ctx) return;
        try {
            const { labels, data } = await fetchTrafficData();
            new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Tráfego',
                        data: data,
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78,115,223,0.05)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { display: true },
                        y: { display: true }
                    }
                }
            });
        } catch (error) {
            alert("Falha ao renderizar gráfico de tráfego: " + error.message);
        }
    }

    async function renderRecentLogsSidebar() {
        const listGroup = document.querySelector('.list-group.list-group-flush');
        if (!listGroup) return;
        listGroup.innerHTML = "";
        try {
            const logs = await fetchAlertsData();
            logs.slice(0, 6).forEach(log => {
                const a = document.createElement('a');
                a.href = "#";
                a.classList.add('list-group-item', 'list-group-item-action');

                const divTop = document.createElement('div');
                divTop.classList.add('d-flex', 'w-100', 'justify-content-between');

                const h6 = document.createElement('h6');
                h6.classList.add('mb-1');
                h6.textContent = log.type || 'Log';

                const smallTime = document.createElement('small');
                // Mostra apenas hora/minuto se possível
                if (log.timestamp) {
                    const date = new Date(log.timestamp);
                    smallTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    smallTime.textContent = "-";
                }

                divTop.appendChild(h6);
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
            const err = document.createElement('div');
            err.textContent = "Erro ao carregar logs recentes.";
            err.classList.add('text-danger', 'p-2');
            listGroup.appendChild(err);
        }
    }
document.addEventListener("DOMContentLoaded", () => {
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





async function renderRulesTable() {
    const tableBody = document.querySelector("#rulesTable tbody");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";

    try {
        const rules = await fetchRules();

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

            // Ajuste na verificação do status (Case Sensitive)
            const isActive = rule.status === "Ativa"; 
            span.textContent = rule.status;
            span.classList.add("badge", isActive ? "badge-success" : "badge-secondary");
            tdStatus.appendChild(span);
            tr.appendChild(tdStatus);

            // Coluna de Botões
            const tdBtns = document.createElement("td");

            // Editar (PATCH)
            const btnEdit = document.createElement("button");
            btnEdit.textContent = "Editar";
            btnEdit.classList.add("btn", "btn-sm", "btn-warning", "mr-1"); // Adicionei mr-1 para espaçamento
            btnEdit.onclick = async () => {
                const newName = prompt("Editar nome da regra:", rule.name);
                if (newName && newName !== rule.name) {
                    await updateRuleName(rule.id, newName);
                    renderRulesTable();
                }
            };
            tdBtns.appendChild(btnEdit);

            // Alternar Status (PUT/PATCH)
            const btnToggle = document.createElement("button");
            btnToggle.textContent = isActive ? "Desativar" : "Ativar";
            btnToggle.classList.add("btn", "btn-sm", isActive ? "btn-danger" : "btn-success", "mr-1");
            btnToggle.onclick = async () => {
                await updateRuleStatus(rule.id, isActive ? "Inativa" : "Ativa");
                renderRulesTable();
            };
            tdBtns.appendChild(btnToggle);

            // Remover (DELETE)
            const btnRemove = document.createElement("button");
            btnRemove.textContent = "Remover";
            btnRemove.classList.add("btn", "btn-sm", "btn-outline-danger");
            btnRemove.onclick = async () => {
                if (confirm(`Remover regra "${rule.name}"?`)) {
                    await deleteRule(rule.id);
                    renderRulesTable();
                }
            };
            tdBtns.appendChild(btnRemove);

            tr.appendChild(tdBtns);
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao renderizar tabela:", error);
        tableBody.innerHTML = "<tr><td colspan='6' class='text-center text-danger'>Erro ao conectar com o servidor.</td></tr>";
    }
}

    const showFakeSearch = (input) => {
        const query = input.value.trim();
        if (!query) {
            alert("Digite um termo para buscar.");
            return;
        }
        alert(`Resultados falsos encontrados para \"${query}\":\n- 12 eventos relacionados\n- 3 alertas críticos\n- 1 regra recomendada`);
    };


    // Variável para armazenar alertas carregados da API
    let currentAlerts = [];

    // Função assíncrona para buscar alertas da API
    async function fetchAlerts() {
        try {
            const data = await fetchAlertsData();
            currentAlerts = Array.isArray(data) ? data : [];
        } catch (error) {
            alert("Falha ao carregar alertas: " + error.message);
            currentAlerts = [];
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
            if (fromDate && alertDate < fromDate) {
                return false;
            }
            if (toDate && alertDate > toDate) {
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
                alert(
                    `Detalhes do Alerta ${alert.id}:\n\n` +
                    `Tipo: ${alert.type}\nDescrição: ${alert.description}\nSeveridade: ${alert.severity}\nStatus: ${alert.status}\nTimestamp: ${alert.timestamp}`
                );
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
            alert("Não há dados de dashboard para gerar relatório.");
            return;
        }
        downloadFile("relatorio-dashboard.csv", data);
    };

    const handleExportAlerts = (event) => {
        event.preventDefault();
        const data = getTableData("alertsListTable");
        if (!data) {
            alert("Não há alertas para exportar.");
            return;
        }
        downloadFile("alertas-export.csv", data);
    };

    const handleExportLogs = (event) => {
        event.preventDefault();
        const logs = [
            ["ID", "Timestamp", "Origem", "Destino", "Status"],
            ["1", "2026-03-15 10:00:00", "192.168.1.10", "10.0.0.1", "OK"],
            ["2", "2026-03-15 10:05:32", "10.0.0.5", "172.16.0.8", "Bloqueado"],
            ["3", "2026-03-15 10:12:08", "192.168.1.20", "8.8.8.8", "Alerta"],
            ["4", "2026-03-15 10:20:45", "10.0.0.15", "172.16.0.5", "OK"],
        ];
        const csv = logs.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
        downloadFile("logs-export.csv", csv);
    };


    async function handleSaveRule() {
        const name = document.getElementById("ruleName").value.trim();
        const condition = document.getElementById("ruleCondition").value.trim();
        const action = document.getElementById("ruleAction").value.trim();

        if (!name || !condition) {
            alert("Preencha o nome e a condição da regra antes de salvar.");
            return;
        }

        const newRule = {
            name,
            condition,
            action,
            status: "Ativa"
        };
        const created = await createRule(newRule);
        if (created) {
            renderRulesTable();
            document.getElementById("ruleName").value = "";
            document.getElementById("ruleCondition").value = "";
            document.getElementById("ruleAction").selectedIndex = 0;
            if (window.$) {
                window.$("#addRuleModal").modal("hide");
            }
            alert("Regra adicionada com sucesso.");
        }
    }

    // Funções handleRuleAction e handleRemoveRule removidas pois agora os eventos são atrelados diretamente na renderização dinâmica

    const handleAlertDetails = (button) => {
        const row = button.closest("tr");
        if (!row) {
            return;
        }
        const cells = Array.from(row.querySelectorAll("td")).map(cell => cell.innerText.trim());
        alert(`Detalhes do alerta:\nID: ${cells[0]}\nTimestamp: ${cells[1]}\nTipo: ${cells[2]}\nDescrição: ${cells[3]}\nSeveridade: ${cells[4]}\nStatus: ${cells[5]}`);
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
            alert(`Ação de menu: ${action}. Esta funcionalidade está simulada com dados falsos.`);
        });
    });

    // Logs buttons
    document.querySelectorAll('.block-ip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('IP bloqueado com sucesso!');
        });
    });
    document.querySelectorAll('.investigate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Investigação iniciada. Resultados: Nenhuma ameaça adicional encontrada.');
        });
    });
});
