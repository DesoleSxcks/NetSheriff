function normalizeSeverity(severity) {
  const value = String(severity || '').toLowerCase();
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'medium';
}

const DOCKER_CHAINS = new Set([
  'DOCKER',
  'DOCKER-BRIDGE',
  'DOCKER-CT',
  'DOCKER-FORWARD',
  'DOCKER-USER',
  'DOCKER-ISOLATION-STAGE-1',
  'DOCKER-ISOLATION-STAGE-2'
]);

function isDockerChain(chainName) {
  return DOCKER_CHAINS.has(String(chainName || '').toUpperCase());
}

export function mapFirewallAudit(audit) {
  const findings = Array.isArray(audit?.findings) ? audit.findings : [];
  const chains = Array.isArray(audit?.chains) ? audit.chains : [];
  const rules = chains.flatMap((chain) => (chain.rules || []).map((rule) => ({
    chain: chain.name,
    protocol: rule.protocol || 'any',
    port: rule.destinationPort || null,
    source: rule.source || 'any',
    destination: rule.destination || 'any',
    action: rule.target || 'ACCEPT',
    raw: rule.raw || '',
    origin: 'iptables'
  })));

  const auditAlerts = findings
    .filter((finding) => ['high', 'medium'].includes(normalizeSeverity(finding.severity)))
    .map((finding, index) => ({
      id: index + 1,
      timestamp: new Date().toISOString(),
      type: finding.title || 'Achado de auditoria',
      description: finding.description || '',
      severity: normalizeSeverity(finding.severity),
      status: 'Ativo',
      recommendation: finding.recommendation || '',
      origin: 'iptables'
    }));

  const informationalFindings = findings.filter((finding) => !['high', 'medium'].includes(normalizeSeverity(finding.severity)));

  const monitoring = {
    status: audit?.available ? 'Disponível' : 'Indisponível',
    riskLevel: audit?.summary?.riskLevel || 'unknown',
    chainsCount: audit?.summary?.chainsCount ?? chains.length,
    rulesCount: audit?.summary?.rulesCount ?? rules.length,
    acceptRulesCount: rules.filter((rule) => String(rule.action).toUpperCase() === 'ACCEPT').length,
    blockRulesCount: rules.filter((rule) => ['DROP', 'REJECT'].includes(String(rule.action).toUpperCase())).length,
    sensitiveOpenPortsCount: rules.filter((rule) => ['22', '3306', '5432', '6379', '27017', '3000'].includes(String(rule.port)) && String(rule.action).toUpperCase() === 'ACCEPT').length,
    recommendationsCount: findings.length,
    trafficMessage: audit?.available ? 'Dados de tráfego em tempo real indisponíveis. Exibindo apenas status e configuração atual do firewall.' : 'Dados reais do firewall indisponíveis. O comando iptables exige permissão administrativa no Linux.'
  };

  const auditLogs = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      origin: 'Auditoria Firewall',
      type: 'Auditoria Firewall',
      severity: audit?.available ? 'info' : 'info',
      message: audit?.available ? 'Auditoria de firewall executada.' : 'Auditoria de firewall indisponível por falta de permissão.',
      actionSuggested: audit?.available ? 'Verifique os principais achados de auditoria.' : 'A auditoria de iptables exige permissão adequada no Linux.'
    },
    ...auditAlerts.map((finding, index) => ({
      id: index + 2,
      timestamp: new Date().toISOString(),
      origin: 'Auditoria Firewall',
      type: 'Auditoria Firewall',
      severity: normalizeSeverity(finding.severity),
      message: finding.description || finding.type || 'Achado de auditoria',
      actionSuggested: finding.recommendation || 'Revisar configuração.'
    }))
  ];

  const dashboard = {
    criticalAlerts: auditAlerts.filter((alert) => alert.severity === 'high').length,
    activeRules: rules.length,
    firewallStatus: audit?.available ? 'Disponível' : 'Indisponível',
    riskLevel: audit?.summary?.riskLevel || 'unknown',
    recommendationsCount: auditAlerts.length,
    firewallSummary: audit?.available ? 'Auditoria do firewall disponível.' : 'Auditoria indisponível.'
  };

  return {
    alerts: auditAlerts,
    auditAlerts,
    allFindings: findings,
    informationalFindings,
    rules,
    monitoring,
    logs: auditLogs,
    dashboard
  };
}
