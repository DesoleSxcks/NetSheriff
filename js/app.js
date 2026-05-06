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


    // Funções CRUD assíncronas para regras usando Fetch
    const RULES_API_URL = "http://localhost:3000/rules";

    async function fetchRules() {
        try {
            const response = await fetch(RULES_API_URL);
            if (!response.ok) throw new Error("Erro ao buscar regras");
            return await response.json();
        } catch (error) {
            alert("Falha ao carregar regras: " + error.message);
            return [];
        }
    }

    async function createRule(rule) {
        try {
            const response = await fetch(RULES_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(rule)
            });
            if (!response.ok) throw new Error("Erro ao criar regra");
            return await response.json();
        } catch (error) {
            alert("Falha ao criar regra: " + error.message);
            return null;
        }
    }

    async function updateRuleStatus(id, status) {
        try {
            const response = await fetch(`${RULES_API_URL}/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error("Erro ao atualizar status da regra");
            return await response.json();
        } catch (error) {
            alert("Falha ao atualizar status: " + error.message);
            return null;
        }
    }

    async function updateRuleName(id, name) {
        try {
            const response = await fetch(`${RULES_API_URL}/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error("Erro ao editar regra");
            return await response.json();
        } catch (error) {
            alert("Falha ao editar regra: " + error.message);
            return null;
        }
    }

    async function deleteRule(id) {
        try {
            const response = await fetch(`${RULES_API_URL}/${id}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Erro ao remover regra");
            return true;
        } catch (error) {
            alert("Falha ao remover regra: " + error.message);
            return false;
        }
    }


    async function renderRulesTable() {
        const tableBody = document.querySelector("#rulesTable tbody");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        const rules = await fetchRules();
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

            // Status
            const tdStatus = document.createElement("td");
            const span = document.createElement("span");
            const active = rule.status && rule.status.trim().toLowerCase() === "ativa";
            span.textContent = rule.status;
            span.classList.add("badge", active ? "badge-success" : "badge-secondary");
            tdStatus.appendChild(span);
            tr.appendChild(tdStatus);

            // Ações
            const tdBtns = document.createElement("td");

            // Editar
            const btnEdit = document.createElement("button");
            btnEdit.textContent = "Editar";
            btnEdit.classList.add("btn", "btn-sm", "btn-warning", "rule-action-btn");
            btnEdit.addEventListener("click", async (e) => {
                e.preventDefault();
                const newName = prompt("Editar nome da regra:", rule.name);
                if (newName && newName !== rule.name) {
                    await updateRuleName(rule.id, newName);
                    renderRulesTable();
                    alert("Regra atualizada com sucesso.");
                }
            });
            tdBtns.appendChild(btnEdit);

            // Ativar/Desativar
            const btnToggle = document.createElement("button");
            btnToggle.textContent = active ? "Desativar" : "Ativar";
            btnToggle.classList.add("btn", "btn-sm", active ? "btn-danger" : "btn-success", "rule-action-btn");
            btnToggle.addEventListener("click", async (e) => {
                e.preventDefault();
                await updateRuleStatus(rule.id, active ? "Inativa" : "Ativa");
                renderRulesTable();
            });
            tdBtns.appendChild(btnToggle);

            // Remover
            const btnRemove = document.createElement("button");
            btnRemove.textContent = "Remover";
            btnRemove.classList.add("btn", "btn-sm", "btn-outline-danger", "rule-action-btn");
            btnRemove.addEventListener("click", async (e) => {
                e.preventDefault();
                if (confirm(`Remover regra "${rule.name}"? Esta ação não pode ser desfeita.`)) {
                    await deleteRule(rule.id);
                    renderRulesTable();
                    alert(`Regra "${rule.name}" removida.`);
                }
            });
            tdBtns.appendChild(btnRemove);

            tr.appendChild(tdBtns);
            tableBody.appendChild(tr);
        });
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
            const response = await fetch("http://localhost:3000/alerts");
            if (!response.ok) throw new Error("Erro ao buscar alertas");
            const data = await response.json();
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
