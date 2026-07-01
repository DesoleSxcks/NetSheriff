import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIptablesOutput, classifyRiskLevel, buildUnavailableAudit } from './iptablesAudit.js';

test('parseIptablesOutput extracts chains, policies and rules', () => {
  const sample = `*filter
:INPUT ACCEPT [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -p tcp --dport 22 -j ACCEPT
-A INPUT -p tcp --dport 3000 -j ACCEPT
COMMIT
`;

  const result = parseIptablesOutput(sample);

  assert.equal(result.chains.length, 3);
  assert.equal(result.chains[0].name, 'INPUT');
  assert.equal(result.chains[0].policy, 'ACCEPT');
  assert.equal(result.chains[0].rules.length, 2);
  assert.equal(result.chains[0].rules[0].destinationPort, '22');
  assert.equal(result.chains[0].rules[0].protocol, 'tcp');
});

test('classifyRiskLevel marks permissive firewall as high risk', () => {
  const risk = classifyRiskLevel({
    available: true,
    chains: [
      {
        name: 'INPUT',
        policy: 'ACCEPT',
        rules: [{ raw: '-A INPUT -p tcp --dport 22 -j ACCEPT', protocol: 'tcp', destinationPort: '22', source: 'any', target: 'ACCEPT' }]
      }
    ],
    findings: [{ severity: 'high' }, { severity: 'medium' }]
  });

  assert.equal(risk, 'high');
});

test('buildUnavailableAudit returns friendly guidance', () => {
  const result = buildUnavailableAudit({
    reason: 'Sem permissão para ler as regras do iptables.',
    recommendation: 'Execute npm run setup:iptables para configurar a permissão de leitura.'
  });

  assert.equal(result.available, false);
  assert.match(result.message, /indisponível/i);
  assert.match(result.recommendation, /setup:iptables/i);
});
