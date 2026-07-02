// Busca global da barra superior (.navbar-search).
// Cada página registra um filtro via registerSearchFilter(fn); a busca chama
// os filtros registrados com o termo digitado. Sem filtro registrado, aplica
// um filtro genérico sobre tabelas e listas visíveis da página.

import { matchesQuery } from './utils.js';

const searchHandlers = [];
let currentQuery = '';

export function getSearchQuery() {
    return currentQuery;
}

export function registerSearchFilter(handler) {
    if (typeof handler === 'function') {
        searchHandlers.push(handler);
    }
}

function runSearch(rawQuery) {
    currentQuery = String(rawQuery || '').trim();

    if (searchHandlers.length) {
        searchHandlers.forEach((handler) => handler(currentQuery));
    } else {
        applyGenericSearch(currentQuery);
    }
}

// Filtra as linhas de uma tabela já renderizada, escondendo as que não
// combinam com o termo. Mostra "Nenhum resultado encontrado" quando nada casa.
export function filterTableRows(table, query) {
    if (!table) return 0;
    const tbody = table.querySelector('tbody');
    if (!tbody) return 0;

    const rows = Array.from(tbody.querySelectorAll('tr'))
        .filter((row) => !row.classList.contains('search-empty-row') && !row.querySelector('.table-status-cell'));

    let visibleCount = 0;
    rows.forEach((row) => {
        const text = row.textContent || '';
        const visible = matchesQuery([text], query);
        row.style.display = visible ? '' : 'none';
        if (visible) visibleCount += 1;
    });

    let emptyRow = tbody.querySelector('.search-empty-row');
    if (!visibleCount && rows.length && query) {
        if (!emptyRow) {
            emptyRow = document.createElement('tr');
            emptyRow.className = 'search-empty-row';
            const cell = document.createElement('td');
            const headerCells = table.querySelectorAll('thead th').length;
            cell.colSpan = headerCells || 1;
            cell.className = 'text-center text-muted';
            cell.textContent = 'Nenhum resultado encontrado.';
            emptyRow.appendChild(cell);
            tbody.appendChild(emptyRow);
        }
        emptyRow.style.display = '';
    } else if (emptyRow) {
        emptyRow.style.display = 'none';
    }

    return visibleCount;
}

// Filtro genérico usado em páginas sem filtro próprio registrado.
function applyGenericSearch(query) {
    document.querySelectorAll('table').forEach((table) => filterTableRows(table, query));

    document.querySelectorAll('.list-group').forEach((listGroup) => {
        const items = Array.from(listGroup.querySelectorAll('.list-group-item'));
        let visibleCount = 0;
        items.forEach((item) => {
            const visible = matchesQuery([item.textContent || ''], query);
            item.style.display = visible ? '' : 'none';
            if (visible) visibleCount += 1;
        });

        let emptyMessage = listGroup.querySelector('.search-empty-message');
        if (!visibleCount && items.length && query) {
            if (!emptyMessage) {
                emptyMessage = document.createElement('div');
                emptyMessage.className = 'search-empty-message text-muted p-2';
                emptyMessage.textContent = 'Nenhum resultado encontrado.';
                listGroup.appendChild(emptyMessage);
            }
            emptyMessage.style.display = '';
        } else if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
    });
}

// Liga todas as barras de busca do layout (desktop e dropdown mobile).
export function initSearchBar() {
    document.querySelectorAll('.navbar-search').forEach((form) => {
        const input = form.querySelector('input[type=text], input[type=search]');
        if (!input) return;

        const button = form.querySelector('button');

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            runSearch(input.value);
        });

        // Filtra em tempo real, sem recarregar a página.
        input.addEventListener('input', () => runSearch(input.value));

        if (button) {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                runSearch(input.value);
            });
        }
    });
}
