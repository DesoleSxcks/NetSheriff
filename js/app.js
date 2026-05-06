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

    const RULES_STORAGE_KEY = "netsheriffRules";

    const getDefaultRules = () => [
        { id: 1, name: "Block High Traffic", condition: "traffic > 1000 packets/min", action: "Alert", status: "Ativa" },
        { id: 2, name: "Detect Port Scans", condition: "ports scanned > 10", action: "Block", status: "Ativa" },
        { id: 3, name: "Monitor Anomalies", condition: "unusual patterns detected", action: "Log", status: "Inativa" },
        { id: 4, name: "SQL Injection Detection", condition: "SQL patterns in HTTP requests", action: "Block", status: "Ativa" },
    ];

    const loadRules = () => {
        try {
            const raw = localStorage.getItem(RULES_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn("Falha ao carregar regras do localStorage", error);
        }
        return getDefaultRules();
    };

    const saveRules = (rules) => {
        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
    };

    const renderRulesTable = () => {
        const tableBody = document.querySelector("#rulesTable tbody");
        if (!tableBody) {
            return;
        }
        const rules = loadRules();
        tableBody.innerHTML = rules.map(rule => {
            const active = rule.status.trim().toLowerCase() === "ativa";
            return `
                <tr>
                    <td>${rule.id}</td>
                    <td>${rule.name}</td>
                    <td>${rule.condition}</td>
                    <td>${rule.action}</td>
                    <td><span class="badge ${active ? "badge-success" : "badge-secondary"}">${rule.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-warning rule-action-btn" data-rule-id="${rule.id}" data-action="edit">Editar</button>
                        <button class="btn btn-sm ${active ? "btn-danger" : "btn-success"} rule-action-btn" data-rule-id="${rule.id}" data-action="toggle">${active ? "Desativar" : "Ativar"}</button>
                        <button class="btn btn-sm btn-outline-danger rule-action-btn" data-rule-id="${rule.id}" data-action="remove">Remover</button>
                    </td>
                </tr>
            `;
        }).join("");
    };

    const showFakeSearch = (input) => {
        const query = input.value.trim();
        if (!query) {
            alert("Digite um termo para buscar.");
            return;
        }
        alert(`Resultados falsos encontrados para \"${query}\":\n- 12 eventos relacionados\n- 3 alertas críticos\n- 1 regra recomendada`);
    };

    const ALERTS_DEFAULT = [
        { id: 1, timestamp: "2026-03-15 10:00:00", type: "Suspicious Traffic", description: "High volume from unknown IP 192.168.1.100", severity: "High", status: "Ativo" },
        { id: 2, timestamp: "2026-03-15 10:05:00", type: "Port Scan", description: "Multiple port attempts from IP 10.0.0.5", severity: "Medium", status: "Resolvido" },
        { id: 3, timestamp: "2026-03-15 10:10:00", type: "Anomaly Detected", description: "Unusual pattern in network traffic from subnet 192.168.1.0/24", severity: "Low", status: "Ativo" },
        { id: 4, timestamp: "2026-03-15 09:45:00", type: "Suspicious Traffic", description: "Abnormal data transfer rate detected", severity: "High", status: "Ativo" },
    ];

    const parseAlertDate = (timestamp) => {
        const date = new Date(timestamp);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const getFilterValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : null;
    };

    const filterAlerts = () => {
        const severity = getFilterValue("severityFilter");
        const type = getFilterValue("typeFilter");
        const from = getFilterValue("dateFromFilter");
        const to = getFilterValue("dateToFilter");
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : null;

        return ALERTS_DEFAULT.filter(alert => {
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
    };

    const renderAlertsTable = (alerts) => {
        const tableBody = document.querySelector("#alertsListTable tbody");
        if (!tableBody) {
            return;
        }
        tableBody.innerHTML = alerts.map(alert => `
            <tr>
                <td>${alert.id}</td>
                <td>${alert.timestamp}</td>
                <td>${alert.type}</td>
                <td>${alert.description}</td>
                <td><span class="badge ${alert.severity === "High" ? "badge-danger" : alert.severity === "Medium" ? "badge-warning" : "badge-success"}">${alert.severity}</span></td>
                <td>${alert.status}</td>
                <td><button class="btn btn-sm btn-info alert-details-btn" data-id="${alert.id}">Detalhes</button></td>
            </tr>
        `).join("");
    };

    const updateAlertFilters = () => {
        renderAlertsTable(filterAlerts());
        // Add event listeners for details buttons
        document.querySelectorAll('.alert-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const alertId = e.target.getAttribute('data-id');
                const alert = ALERTS_DEFAULT.find(a => a.id == alertId);
                if (alert) {
                    alert(`Detalhes do Alerta ${alert.id}:\n\nTipo: ${alert.type}\nDescrição: ${alert.description}\nSeveridade: ${alert.severity}\nStatus: ${alert.status}\nTimestamp: ${alert.timestamp}`);
                }
            });
        });
    };

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

    const handleSaveRule = () => {
        const name = document.getElementById("ruleName").value.trim();
        const condition = document.getElementById("ruleCondition").value.trim();
        const action = document.getElementById("ruleAction").value.trim();

        if (!name || !condition) {
            alert("Preencha o nome e a condição da regra antes de salvar.");
            return;
        }

        const rules = loadRules();
        const newId = rules.reduce((maxId, rule) => Math.max(maxId, rule.id), 0) + 1;
        rules.push({
            id: newId,
            name,
            condition,
            action,
            status: "Ativa",
        });
        saveRules(rules);
        renderRulesTable();

        document.getElementById("ruleName").value = "";
        document.getElementById("ruleCondition").value = "";
        document.getElementById("ruleAction").selectedIndex = 0;

        if (window.$) {
            window.$("#addRuleModal").modal("hide");
        }
        alert("Regra adicionada com sucesso.");
    };

    const handleRuleAction = (button) => {
        const row = button.closest("tr");
        const statusBadge = row.querySelector("span.badge");
        const currentAction = button.dataset.action;

        if (currentAction === "edit") {
            const ruleId = Number(button.dataset.ruleId);
            const rules = loadRules();
            const rule = rules.find(item => item.id === ruleId);
            if (!rule) {
                return;
            }
            const newName = prompt("Editar nome da regra:", rule.name);
            if (newName) {
                rule.name = newName;
                saveRules(rules);
                renderRulesTable();
                alert("Regra atualizada com sucesso.");
            }
            return;
        }

        if (currentAction === "remove") {
            handleRemoveRule(button);
            return;
        }

        const ruleId = Number(button.dataset.ruleId);
        const rules = loadRules();
        const rule = rules.find(item => item.id === ruleId);
        if (!rule) {
            return;
        }
        const isActive = rule.status.trim().toLowerCase() === "ativa";
        rule.status = isActive ? "Inativa" : "Ativa";
        saveRules(rules);
        renderRulesTable();
    };

    const handleRemoveRule = (button) => {
        const ruleId = Number(button.dataset.ruleId);
        const rules = loadRules();
        const rule = rules.find(item => item.id === ruleId);
        if (!rule) {
            return;
        }
        const confirmRemove = confirm(`Remover regra "${rule.name}"? Esta ação não pode ser desfeita.`);
        if (confirmRemove) {
            const updated = rules.filter(item => item.id !== ruleId);
            saveRules(updated);
            renderRulesTable();
            alert(`Regra "${rule.name}" removida.`);
        }
    };

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

    const alertsTable = document.getElementById("alertsListTable");
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

    if (alertsTable) {
        renderAlertsTable(filterAlerts());
        alertsTable.addEventListener("click", (event) => {
            const button = event.target.closest("button.btn-info");
            if (button) {
                handleAlertDetails(button);
            }
        });
    }

    const rulesTable = document.getElementById("rulesTable");
    if (rulesTable) {
        rulesTable.addEventListener("click", (event) => {
            const button = event.target.closest("button.rule-action-btn");
            if (button) {
                event.preventDefault();
                handleRuleAction(button);
            }
        });
    }

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
