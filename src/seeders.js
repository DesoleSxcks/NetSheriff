import pool from './db.js';

async function up() {
  try {
    // rules
    await pool.query(`INSERT INTO rules (id, name, condition_text, action, status) VALUES
      (1, 'Block High Traffic', 'traffic > 1000 packets/min', 'Alert', 'Ativa'),
      (2, 'Detect Port Scans', 'ports scanned > 10', 'Block', 'Ativa'),
      (3, 'Monitor Anomalies', 'unusual patterns detected', 'Log', 'Inativa'),
      (4, 'SQL Injection Detection', 'SQL patterns in HTTP requests', 'Block', 'Ativa')
      ON DUPLICATE KEY UPDATE name=VALUES(name), condition_text=VALUES(condition_text), action=VALUES(action), status=VALUES(status)`);

    // alerts
    await pool.query(`INSERT INTO alerts (id, timestamp, type, description, severity, status) VALUES
      (1, '2026-03-15 10:00:00', 'Suspicious Traffic', 'High volume from unknown IP 192.168.1.100', 'High', 'Ativo'),
      (2, '2026-03-15 10:05:00', 'Port Scan', 'Multiple port attempts from IP 10.0.0.5', 'Medium', 'Resolvido')
      ON DUPLICATE KEY UPDATE timestamp=VALUES(timestamp), type=VALUES(type), description=VALUES(description), severity=VALUES(severity), status=VALUES(status)`);

    // logs
    await pool.query(`INSERT INTO logs (id, timestamp, origin, type, severity, action_type) VALUES
      (1, '10:00:00', '192.168.1.5', 'SQL Injection', 'Crítico', 'block'),
      (2, '10:05:00', '10.0.0.12', 'Port Scan', 'Médio', 'investigate')
      ON DUPLICATE KEY UPDATE timestamp=VALUES(timestamp), origin=VALUES(origin), type=VALUES(type), severity=VALUES(severity), action_type=VALUES(action_type)`);

    // traffic
    await pool.query(`INSERT INTO traffic (label_time, traffic_data) VALUES
      ('00h', 500),
      ('04h', 1200),
      ('08h', 800),
      ('12h', 2500),
      ('16h', 1000),
      ('20h', 600)`);
  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  }
}

export default { up };
