// Utilitários compartilhados de UI e formatação.

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

export function showNotification({ type = 'info', title, message, duration = 2800 }) {
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

export function setInlineStatus(element, { type = 'loading', message }) {
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

export function setTableStatusMessage(tableBody, { type = 'loading', message, colSpan = 6 }) {
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = colSpan;
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

export function setButtonBusy(button, isBusy, label = 'Processando...') {
    if (!button) return;
    button.disabled = isBusy;
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.textContent = isBusy ? label : button.dataset.originalText;
}

export function getPortugueseMessage(error, fallback) {
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

export function formatAlertOrigin(origin) {
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

export function normalizeSeverity(severity) {
    const value = normalizeText(severity).trim();

    if (['high', 'critical', 'critico'].includes(value)) return 'High';
    if (['medium', 'medio'].includes(value)) return 'Medium';
    if (['low', 'baixo'].includes(value)) return 'Low';
    if (['info', 'informativo'].includes(value)) return 'Info';

    return 'Info';
}

export function downloadFile(filename, content, mimeType = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

export function tableToCsv(table) {
    const rows = Array.from(table.querySelectorAll('thead tr, tbody tr'))
        .filter((row) => row.style.display !== 'none'
            && !row.classList.contains('search-empty-row')
            && !row.querySelector('.table-status-cell'));
    const csv = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => `"${(cell.textContent || '').trim().replace(/"/g, '""')}"`).join(',');
    }).join('\n');
    return csv;
}

// Normaliza texto para busca: minúsculas e sem acentos.
export function normalizeText(value) {
    return String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Verifica se algum dos campos contém o termo buscado.
export function matchesQuery(fields, query) {
    const normalizedQuery = normalizeText(query).trim();
    if (!normalizedQuery) return true;
    return fields.some((field) => normalizeText(field).includes(normalizedQuery));
}
