// Página de auditoria (audit.html): consulta a auditoria do iptables e
// renderiza resumo, chains, achados e recomendações, com busca nos achados.

import { fetchIptablesAudit } from './api.js';
import { requireAuth, initLayout } from './main.js';
import { initSearchBar, registerSearchFilter, getSearchQuery } from './search.js';
import { matchesQuery } from './utils.js';

let lastAuditData = null;

function getRiskBadgeClass(level) {
  switch (level) {
    case 'high': return 'badge-danger';
    case 'medium': return 'badge-warning';
    case 'low': return 'badge-success';
    default: return 'badge-secondary';
  }
}

function getFindings(data) {
  return Array.isArray(data?.findings) ? data.findings : [];
}

function getChains(data) {
  return Array.isArray(data?.chains) ? data.chains : [];
}

function getRuleSearchFields(chain, rule) {
  return [
    chain.name,
    chain.policy,
    rule.raw,
    rule.protocol,
    rule.destinationPort,
    rule.source,
    rule.destination,
    rule.target,
    `${chain.name} ${chain.policy || ''} ${rule.raw || ''} ${rule.protocol || ''} ${rule.destinationPort || ''} ${rule.target || ''}`
  ];
}

function filterChains(chains, query) {
  if (!query) return chains;

  return chains.reduce((filtered, chain) => {
    const rules = Array.isArray(chain.rules) ? chain.rules : [];
    const chainMatches = matchesQuery([chain.name, chain.policy], query);
    const matchingRules = rules.filter((rule) => matchesQuery(getRuleSearchFields(chain, rule), query));

    if (chainMatches || matchingRules.length) {
      filtered.push({
        ...chain,
        rules: chainMatches ? rules : matchingRules
      });
    }

    return filtered;
  }, []);
}

function filterFindings(findings, query) {
  return findings.filter((finding) => matchesQuery([
    finding.title,
    finding.description,
    finding.severity,
    finding.origin,
    finding.recommendation
  ], query));
}

function renderChains(chains, searching) {
  const chainsListEl = document.getElementById('auditChainsList');
  if (!chainsListEl) return;

  if (!lastAuditData?.available) {
    chainsListEl.innerHTML = '<div class="text-muted">Dados reais do firewall indisponíveis. O comando iptables exige permissão administrativa no Linux.</div>';
    return;
  }

  if (!chains.length) {
    chainsListEl.innerHTML = `<div class="text-muted">${searching ? 'Nenhum resultado encontrado.' : 'Nenhuma chain encontrada.'}</div>`;
    return;
  }

  chainsListEl.innerHTML = chains.map((chain) => {
    const rules = Array.isArray(chain.rules) ? chain.rules : [];

    return `
      <div class="border rounded p-3 mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong>${chain.name}</strong>
          <span class="badge badge-secondary">Policy: ${chain.policy || 'UNDEFINED'}</span>
        </div>
        ${rules.length ? rules.map((rule) => `
          <div class="small text-muted mb-1">
            <code>${rule.raw || ''}</code>
          </div>`).join('') : '<div class="text-muted small">Sem regras registradas.</div>'}
      </div>`;
  }).join('');
}

function renderFindings(findings, searching) {
  const findingsEl = document.getElementById('auditFindings');
  const recommendationsEl = document.getElementById('auditRecommendations');
  const emptyMessage = searching ? 'Nenhum resultado encontrado.' : 'Nenhum achado de auditoria registrado.';

  if (findingsEl) {
    findingsEl.innerHTML = findings.length ? findings.map((finding) => `
      <div class="border-left-${finding.severity === 'high' ? 'danger' : finding.severity === 'medium' ? 'warning' : 'info'} border-left pl-3 mb-3">
        <div class="font-weight-bold">${finding.title}</div>
        <div class="small text-muted">${finding.description}</div>
        <div class="small mt-1"><strong>Severidade:</strong> <span class="badge ${getRiskBadgeClass(finding.severity)}">${finding.severity}</span></div>
        <div class="small mt-1"><strong>Origem:</strong> ${finding.origin || 'iptables'}</div>
      </div>`).join('') : `<div class="text-muted">${emptyMessage}</div>`;
  }

  if (recommendationsEl) {
    recommendationsEl.innerHTML = findings.length ? findings.map((finding) => `
      <div class="alert alert-light border mb-2">
        <div class="small"><strong>${finding.title}</strong></div>
        <div class="small text-muted">${finding.recommendation || 'Revisar configuração.'}</div>
      </div>`).join('') : `<div class="text-muted">${searching ? 'Nenhum resultado encontrado.' : 'Nenhuma recomendação disponível.'}</div>`;
  }
}

function applyAuditSearch(query) {
  if (!lastAuditData) return;

  const searching = Boolean(query);
  renderChains(filterChains(getChains(lastAuditData), query), searching);
  renderFindings(filterFindings(getFindings(lastAuditData), query), searching);
}

function renderAudit(data) {
  lastAuditData = data;

  const statusEl = document.getElementById('auditStatus');
  const riskEl = document.getElementById('auditRisk');
  const chainsEl = document.getElementById('auditChains');
  const rulesEl = document.getElementById('auditRules');
  const messageEl = document.getElementById('auditMessage');

  if (!data) {
    if (statusEl) statusEl.textContent = 'Indisponível';
    if (riskEl) riskEl.textContent = 'N/A';
    if (messageEl) messageEl.innerHTML = '<div class="alert alert-warning">Não foi possível carregar a auditoria.</div>';
    return;
  }

  const rules = Array.isArray(data.rules) ? data.rules : [];
  const findings = getFindings(data);
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

  applyAuditSearch(getSearchQuery());
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
  if (!requireAuth()) return;

  initLayout();
  initSearchBar();
  registerSearchFilter(applyAuditSearch);

  loadAudit();
});
