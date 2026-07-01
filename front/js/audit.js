import { fetchIptablesAudit, getCurrentUser, isAuthenticated, logout } from './api.js';

function getRiskBadgeClass(level) {
  switch (level) {
    case 'high': return 'badge-danger';
    case 'medium': return 'badge-warning';
    case 'low': return 'badge-success';
    default: return 'badge-secondary';
  }
}

function renderAudit(data) {
  const statusEl = document.getElementById('auditStatus');
  const riskEl = document.getElementById('auditRisk');
  const chainsEl = document.getElementById('auditChains');
  const rulesEl = document.getElementById('auditRules');
  const messageEl = document.getElementById('auditMessage');
  const chainsListEl = document.getElementById('auditChainsList');
  const findingsEl = document.getElementById('auditFindings');
  const recommendationsEl = document.getElementById('auditRecommendations');

  if (!data) {
    if (statusEl) statusEl.textContent = 'Indisponível';
    if (riskEl) riskEl.textContent = 'N/A';
    if (messageEl) messageEl.innerHTML = '<div class="alert alert-warning">Não foi possível carregar a auditoria.</div>';
    return;
  }

  const rules = Array.isArray(data.rules) ? data.rules : [];
  const findings = Array.isArray(data.findings) ? data.findings : [];
  const monitoring = data.monitoring || {};

  if (statusEl) {
    statusEl.textContent = data.available ? 'Disponível' : 'Indisponível';
    statusEl.className = `h5 mb-0 font-weight-bold ${data.available ? 'text-success' : 'text-warning'}`;
  }

  if (riskEl) {
    const level = data.summary?.riskLevel || monitoring.riskLevel || 'unknown';
    riskEl.innerHTML = `<span class="badge ${getRiskBadgeClass(level)}">${String(level).toUpperCase()}</span>`;
  }

  if (chainsEl) chainsEl.textContent = data.summary?.chainsCount ?? monitoring.chainsCount ?? 0;
  if (rulesEl) rulesEl.textContent = data.summary?.rulesCount ?? monitoring.rulesCount ?? rules.length;

  if (messageEl) {
    if (data.available) {
      messageEl.innerHTML = `
        <div class="alert alert-success mb-0">
          <strong>Dados reais do firewall disponíveis.</strong> A auditoria consultou as regras atuais do iptables e encontrou <strong>${findings.length}</strong> achados de configuração com risco geral <strong>${String(data.summary?.riskLevel || monitoring.riskLevel || 'unknown').toUpperCase()}</strong>.
        </div>`;
    } else {
      messageEl.innerHTML = `
        <div class="alert alert-warning mb-0">
          <strong>${data.message || 'Auditoria indisponível.'}</strong><br>
          ${data.reason || ''}<br>
          ${data.recommendation || ''}
        </div>`;
    }
  }

  if (chainsListEl) {
    if (!data.available || !Array.isArray(data.chains) || !data.chains.length) {
      chainsListEl.innerHTML = '<div class="text-muted">Dados reais do firewall indisponíveis. O comando iptables exige permissão administrativa no Linux.</div>';
    } else {
      chainsListEl.innerHTML = data.chains.map((chain) => `
        <div class="border rounded p-3 mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>${chain.name}</strong>
            <span class="badge badge-secondary">Policy: ${chain.policy || 'UNDEFINED'}</span>
          </div>
          ${chain.rules.length ? chain.rules.map((rule) => `
            <div class="small text-muted mb-1">
              <code>${rule.raw || ''}</code>
            </div>`).join('') : '<div class="text-muted small">Sem regras registradas.</div>'}
        </div>`).join('');
    }
  }

  if (findingsEl) {
    findingsEl.innerHTML = findings.length ? findings.map((finding) => `
      <div class="border-left-${finding.severity === 'high' ? 'danger' : finding.severity === 'medium' ? 'warning' : 'info'} border-left pl-3 mb-3">
        <div class="font-weight-bold">${finding.title}</div>
        <div class="small text-muted">${finding.description}</div>
        <div class="small mt-1"><strong>Severidade:</strong> <span class="badge ${getRiskBadgeClass(finding.severity)}">${finding.severity}</span></div>
        <div class="small mt-1"><strong>Origem:</strong> ${finding.origin || 'iptables'}</div>
      </div>`).join('') : '<div class="text-muted">Nenhum achado de auditoria registrado.</div>';
  }

  if (recommendationsEl) {
    recommendationsEl.innerHTML = findings.length ? findings.map((finding) => `
      <div class="alert alert-light border mb-2">
        <div class="small"><strong>${finding.title}</strong></div>
        <div class="small text-muted">${finding.recommendation || 'Revisar configuração.'}</div>
      </div>`).join('') : '<div class="text-muted">Nenhuma recomendação disponível.</div>';
  }
}

async function loadAudit() {
  try {
    const data = await fetchIptablesAudit();
    renderAudit(data);
  } catch (error) {
    renderAudit({
      available: false,
      message: 'Não foi possível consultar a auditoria de iptables.',
      reason: error?.message || 'Erro ao consultar o backend.',
      recommendation: 'Verifique se o backend está rodando e se o token de autenticação está válido.'
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const pageName = currentPath.split('/').filter(Boolean).pop() || 'index.html';
  const protectedPages = ['index.html', 'alerts.html', 'rules.html', 'monitoring.html', 'audit.html'];

  if (protectedPages.includes(pageName) && !isAuthenticated()) {
    window.location.replace('login.html');
    return;
  }

  const userDisplayElements = document.querySelectorAll('#userDisplayName');
  const user = getCurrentUser();
  userDisplayElements.forEach((element) => {
    element.textContent = user?.name || 'Administrador';
  });

  document.querySelectorAll('#logoutModal a[href="login.html"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      logout();
      window.location.href = 'login.html';
    });
  });

  loadAudit();
});
