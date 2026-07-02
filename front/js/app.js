// Ponto de entrada do frontend. Cada módulo de página verifica se os
// elementos que lhe pertencem existem antes de fazer qualquer coisa, então é
// seguro inicializar todos aqui.

import { requireAuth, initLayout } from './main.js';
import { initSearchBar } from './search.js';
import { initDashboard } from './dashboard.js';
import { initAlertsPage } from './alerts.js';
import { initRulesPage } from './rules.js';
import { initMonitoringPage } from './monitoring.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    initLayout();
    initSearchBar();

    initDashboard();
    initAlertsPage();
    initRulesPage();
    initMonitoringPage();
});
