// Inicialização compartilhada do layout: guarda de autenticação, exibição do
// usuário logado, logout e ações simuladas de menus/botões estáticos.

import { getCurrentUser, isAuthenticated, logout } from './api.js';
import { showNotification } from './utils.js';

const PROTECTED_PAGES = ['index.html', 'alerts.html', 'rules.html', 'monitoring.html', 'audit.html'];

export function getPageName() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').filter(Boolean).pop() || 'index.html';
    const isRootPage = currentPath === '/' || currentPath.endsWith('/');
    return isRootPage ? 'index.html' : currentPage;
}

// Redireciona para o login quando a página é protegida e não há sessão.
// Retorna false quando o redirecionamento aconteceu.
export function requireAuth() {
    if (PROTECTED_PAGES.includes(getPageName()) && !isAuthenticated()) {
        window.location.replace('login.html');
        return false;
    }
    return true;
}

function updateUserDisplay() {
    const user = getCurrentUser();
    const displayName = user?.name || 'Administrador';
    document.querySelectorAll('#userDisplayName').forEach((element) => {
        element.textContent = displayName;
    });
}

function attachLogoutHandlers() {
    document.querySelectorAll('#logoutModal a[href="login.html"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
            window.location.href = 'login.html';
        });
    });
}

function attachSimulatedActions() {
    document.querySelectorAll("a.dropdown-item[href='#']:not([data-toggle])").forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const action = link.innerText.trim();
            showNotification({ type: 'info', title: 'Funcionalidade simulada', message: `Ação de menu: ${action}.` });
        });
    });

    document.querySelectorAll('.block-ip-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            showNotification({ type: 'success', title: 'IP bloqueado', message: 'IP bloqueado com sucesso!' });
        });
    });

    document.querySelectorAll('.investigate-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            showNotification({ type: 'info', title: 'Investigação iniciada', message: 'Resultados: nenhuma ameaça adicional encontrada.' });
        });
    });
}

export function initLayout() {
    updateUserDisplay();
    attachLogoutHandlers();
    attachSimulatedActions();
}
