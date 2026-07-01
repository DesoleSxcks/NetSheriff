import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import os from 'os';
import logger from './logger.js';

const execFileAsync = promisify(execFile);

const SENSITIVE_PORTS = new Set(['22', '3306', '5432', '6379', '27017', '3000']);
const PORT_LABELS = {
  22: 'SSH',
  3306: 'MySQL',
  5432: 'PostgreSQL',
  6379: 'Redis',
  27017: 'MongoDB',
  3000: 'Backend'
};

const DOCKER_CHAINS = new Set([
  'DOCKER',
  'DOCKER-BRIDGE',
  'DOCKER-CT',
  'DOCKER-FORWARD',
  'DOCKER-USER',
  'DOCKER-ISOLATION-STAGE-1',
  'DOCKER-ISOLATION-STAGE-2'
]);

function isDockerChain(name) {
  return DOCKER_CHAINS.has(String(name || '').toUpperCase());
}

function detectDockerEnvironment() {
  return Boolean(fs.existsSync('/.dockerenv') || process.env.container || process.env.CGROUP);
}

export function buildUnavailableAudit({ reason, recommendation, environment, message }) {
  return {
    available: false,
    message: message || 'Auditoria de iptables indisponível neste ambiente.',
    reason,
    recommendation,
    environment
  };
}

function getCommandCandidates() {
  const candidates = [];
  const explicitPath = process.env.IPTABLES_SAVE_PATH || process.env.IPTABLES_PATH;

  if (explicitPath) {
    candidates.push(explicitPath);
  }

  candidates.push('/usr/sbin/iptables-save', '/sbin/iptables-save', 'iptables-save');
  return candidates.filter(Boolean);
}

function getIptablesCommands() {
  const saveCandidates = getCommandCandidates();
  const listCandidates = [process.env.IPTABLES_LIST_PATH, '/usr/sbin/iptables', '/sbin/iptables', 'iptables'].filter(Boolean);

  return { saveCandidates, listCandidates };
}

function parseRule(line) {
  const normalized = String(line || '').trim();
  const rule = {
    raw: normalized,
    protocol: 'any',
    destinationPort: null,
    source: 'any',
    target: 'ACCEPT'
  };

  const protocolMatch = normalized.match(/-p\s+(\S+)/i);
  if (protocolMatch) {
    rule.protocol = protocolMatch[1].toLowerCase();
  }

  const sourceMatch = normalized.match(/(?:^|\s)-s\s+(\S+)/i);
  if (sourceMatch) {
    rule.source = sourceMatch[1];
  }

  const dportMatch = normalized.match(/--dport\s+(\S+)/i);
  if (dportMatch) {
    rule.destinationPort = dportMatch[1];
  }

  const targetMatch = normalized.match(/-j\s+(\S+)/i);
  if (targetMatch) {
    rule.target = targetMatch[1].toUpperCase();
  }

  return rule;
}

export function parseIptablesOutput(output) {
  const chains = [];
  const lines = String(output || '').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('*') || trimmed === 'COMMIT') {
      continue;
    }

    if (trimmed.startsWith(':')) {
      const parts = trimmed.split(/\s+/);
      const name = parts[0].slice(1);
      const policy = parts[1] && parts[1] !== '-' ? parts[1].toUpperCase() : 'UNDEFINED';
      chains.push({ name, policy, rules: [] });
      continue;
    }

    if (trimmed.startsWith('-A ')) {
      const parts = trimmed.split(/\s+/);
      const chainName = parts[1];
      const chain = chains.find((entry) => entry.name === chainName);
      if (chain) {
        chain.rules.push(parseRule(trimmed));
      } else {
        chains.push({ name: chainName, policy: 'UNDEFINED', rules: [parseRule(trimmed)] });
      }
    }
  }

  return { chains };
}

function buildFindings(chains) {
  const findings = [];
  const inputChain = chains.find((chain) => chain.name === 'INPUT');

  if (inputChain && inputChain.policy === 'ACCEPT') {
    findings.push({
      severity: 'high',
      title: 'Política padrão INPUT permissiva',
      description: 'A chain INPUT está com política padrão ACCEPT.',
      recommendation: 'Considere usar DROP como política padrão e liberar apenas portas necessárias.'
    });
  }

  const hasRules = chains.some((chain) => chain.rules.length > 0);
  if (!hasRules) {
    findings.push({
      severity: 'medium',
      title: 'Firewall sem regras relevantes',
      description: 'Não foram encontradas regras aplicáveis para avaliar o firewall.',
      recommendation: 'Defina regras explícitas para permitir apenas o tráfego necessário.'
    });
  }

  const hasDropOrReject = chains.some((chain) => chain.rules.some((rule) => ['DROP', 'REJECT'].includes(rule.target.toUpperCase())));
  if (!hasDropOrReject) {
    findings.push({
      severity: 'medium',
      title: 'Ausência de regras DROP/REJECT',
      description: 'Não foram encontradas regras explícitas de bloqueio ou rejeição.',
      recommendation: 'Adicione regras de negação para reduzir a superfície de ataque.'
    });
  }

  chains.forEach((chain) => {
    const isDocker = isDockerChain(chain.name);

    if (chain.policy === 'UNDEFINED') {
      findings.push({
        severity: isDocker ? 'low' : 'medium',
        title: `Chain ${chain.name} sem política definida`,
        description: 'A chain não possui uma política padrão explícita.',
        recommendation: isDocker
          ? 'Esta chain faz parte do ambiente Docker e não representa um risco crítico isoladamente.'
          : 'Defina uma política padrão para evitar tráfego não controlado.'
      });
    }

    if (!chain.rules.length && chain.name !== 'OUTPUT') {
      findings.push({
        severity: isDocker ? 'low' : 'low',
        title: `Chain ${chain.name} sem regras`,
        description: 'A chain não possui regras explícitas registradas.',
        recommendation: isDocker
          ? 'Chains Docker podem permanecer sem regras específicas até que o tráfego seja gerenciado pelo Docker.'
          : 'Revise a necessidade desta chain e alinhe-a com o modelo de segurança esperado.'
      });
    }
  });

  const sensitivePorts = [...SENSITIVE_PORTS].filter((port) => port !== '3000');
  sensitivePorts.forEach((port) => {
    const rule = chains
      .flatMap((chain) => chain.rules)
      .find((entry) => entry.target.toUpperCase() === 'ACCEPT' && entry.destinationPort === port && ['any', '0.0.0.0/0', '0.0.0.0/0.0.0.0/0'].includes(entry.source));

    if (rule) {
      findings.push({
        severity: 'high',
        title: `Porta ${port} aberta para qualquer origem`,
        description: `A porta ${port} (${PORT_LABELS[port] || 'serviço'}) está aberta com regra ACCEPT para qualquer origem.`,
        recommendation: 'Restrinja essa regra a endereços específicos ou remova a exposição desnecessária.'
      });
    }
  });

  const backendRule = chains
    .flatMap((chain) => chain.rules)
    .find((entry) => entry.target.toUpperCase() === 'ACCEPT' && entry.destinationPort === '3000' && ['any', '0.0.0.0/0', '0.0.0.0/0.0.0.0/0'].includes(entry.source));

  if (backendRule) {
    findings.push({
      severity: 'high',
      title: 'Porta do backend 3000 aberta para qualquer origem',
      description: 'A porta 3000 está exposta para qualquer origem.',
      recommendation: 'Limite o acesso à interface administrativa ou ao backend apenas a redes confiáveis.'
    });
  }

  const genericAcceptRules = chains
    .flatMap((chain) => chain.rules)
    .filter((entry) => entry.target.toUpperCase() === 'ACCEPT' && ['any', '0.0.0.0/0'].includes(entry.source) && !entry.destinationPort);

  if (genericAcceptRules.length) {
    findings.push({
      severity: 'medium',
      title: 'Regras ACCEPT muito genéricas',
      description: 'Foram encontradas regras ACCEPT sem restrição de porta ou origem.',
      recommendation: 'Ajuste as regras para limitar o acesso a portas e origens específicas.'
    });
  }

  return findings;
}

export function classifyRiskLevel(audit) {
  if (!audit?.available) {
    return 'unknown';
  }

  const highFindings = (audit.findings || []).filter((finding) => finding.severity === 'high').length;
  const mediumFindings = (audit.findings || []).filter((finding) => finding.severity === 'medium').length;
  const inputChain = (audit.chains || []).find((chain) => chain.name === 'INPUT');
  const hasSensitiveOpenPort = (audit.findings || []).some((finding) => (finding.title || '').includes('Porta') || (finding.title || '').includes('política padrão'));

  if (highFindings > 0 || (inputChain?.policy === 'ACCEPT' && hasSensitiveOpenPort)) {
    return 'high';
  }

  if (mediumFindings > 0 || (inputChain?.policy === 'ACCEPT')) {
    return 'medium';
  }

  return 'low';
}

export async function runIptablesAudit() {
  const environment = {
    platform: os.platform(),
    isDocker: detectDockerEnvironment(),
    command: 'iptables-save'
  };

  if (environment.platform !== 'linux') {
    return buildUnavailableAudit({
      reason: 'Auditoria de iptables disponível apenas em ambientes Linux.',
      recommendation: 'Execute o backend em um ambiente Linux com iptables instalado.',
      environment,
      message: 'Auditoria de iptables disponível apenas em ambientes Linux.'
    });
  }

  const { saveCandidates, listCandidates } = getIptablesCommands();
  const saveBin = saveCandidates.find((candidate) => fs.existsSync(candidate));
  const listBin = listCandidates.find((candidate) => fs.existsSync(candidate));

  if (!saveBin) {
    return buildUnavailableAudit({
      reason: 'iptables não encontrado neste sistema.',
      recommendation: 'Instale o pacote iptables e execute npm run setup:iptables.',
      environment,
      message: 'iptables não encontrado neste sistema.'
    });
  }

  try {
    const { stdout } = await execFileAsync('sudo', ['-n', saveBin], {
      timeout: 4000,
      maxBuffer: 1024 * 1024 * 4
    });

    const listOutput = listBin
      ? await execFileAsync('sudo', ['-n', listBin, '-L', '-n', '-v'], {
          timeout: 4000,
          maxBuffer: 1024 * 1024 * 4
        }).catch(() => ({ stdout: '' }))
      : { stdout: '' };

    const parsed = parseIptablesOutput(stdout);
    const findings = buildFindings(parsed.chains);
    const summary = {
      chainsCount: parsed.chains.length,
      rulesCount: parsed.chains.reduce((total, chain) => total + chain.rules.length, 0),
      findingsCount: findings.length,
      riskLevel: classifyRiskLevel({ available: true, chains: parsed.chains, findings })
    };

    return {
      available: true,
      environment: {
        ...environment,
        commandUsed: saveBin,
        listCommand: listBin || null,
        listOutputAvailable: Boolean(listOutput.stdout)
      },
      summary,
      chains: parsed.chains,
      findings
    };
  } catch (error) {
    logger.warn(`iptables audit unavailable: ${error.message}`);

    let reason = 'Sem permissão para ler as regras do iptables.';
    const stderr = String(error.stderr || error.message || '');
    const message = stderr.toLowerCase();

    if (/not found|enoent/i.test(message)) {
      reason = 'iptables não encontrado neste sistema.';
    } else if (/nft|nf_tables/i.test(message)) {
      reason = 'O sistema parece usar nftables e o comando iptables não fornece a saída esperada.';
    } else if (environment.isDocker) {
      reason = 'Ambiente Docker sem acesso ao firewall do host.';
    }

    return buildUnavailableAudit({
      reason,
      recommendation: reason === 'iptables não encontrado neste sistema.'
        ? 'Instale o pacote iptables e execute npm run setup:iptables.'
        : 'Execute npm run setup:iptables para configurar a permissão de leitura ou rode o backend em um ambiente Linux com permissões adequadas.',
      environment: {
        ...environment,
        commandUsed: saveBin || 'iptables-save',
        listCommand: listBin || null
      },
      message: reason === 'iptables não encontrado neste sistema.'
        ? 'iptables não encontrado neste sistema.'
        : 'Auditoria de iptables indisponível. Execute npm run setup:iptables para configurar a permissão de leitura.'
    });
  }
}
