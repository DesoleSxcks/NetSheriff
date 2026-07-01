import test from 'node:test';
import assert from 'node:assert/strict';
import { mapFirewallAudit } from './firewallDataMapper.js';

test('mapFirewallAudit builds alerts, rules and monitoring from iptables findings', () => {
  const audit = {
    available: true,
    summary: {
      chainsCount: 1,
      rulesCount: 2,
      findingsCount: 2,
      riskLevel: 'high'
    },
    chains: [
      {
        name: 'INPUT',
        policy: 'ACCEPT',
        rules: [
          { raw: '-A INPUT -p tcp --dport 22 -j ACCEPT', protocol: 'tcp', destinationPort: '22', source: '0.0.0.0/0', target: 'ACCEPT' }
        ]
      }
    ],
    findings: [
      {
        severity: 'high',
        title: 'Política permissiva',
        description: 'A chain INPUT está com política padrão ACCEPT.',
        recommendation: 'Restrinja o acesso.'
      }
    ],
    policies: [{ chain: 'INPUT', policy: 'ACCEPT' }],
    portsFound: [{ port: '22', chain: 'INPUT', target: 'ACCEPT', source: '0.0.0.0/0', protocol: 'tcp' }],
    targets: [{ name: 'ACCEPT', count: 1 }]
  };

  const mapped = mapFirewallAudit(audit);

  assert.equal(mapped.alerts.length, 1);
  assert.equal(mapped.alerts[0].origin, 'iptables');
  assert.equal(mapped.rules.length, 1);
  assert.equal(mapped.monitoring.riskLevel, 'high');
  assert.equal(mapped.logs[0].type, 'Auditoria Firewall');
  assert.equal(mapped.dashboard.criticalAlerts, 1);
});
