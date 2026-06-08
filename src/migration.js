import pool from './db.js';

async function up() {
  try {
    // rules
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rules (
        id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        condition_text VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL
      )
    `);

    // alerts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INT PRIMARY KEY,
        timestamp DATETIME NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL
      )
    `);

    // logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT PRIMARY KEY,
        timestamp TIME NOT NULL,
        origin VARCHAR(45) NOT NULL,
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        action_type VARCHAR(50) NOT NULL
      )
    `);

    // traffic
    await pool.query(`
      CREATE TABLE IF NOT EXISTS traffic (
        id INT AUTO_INCREMENT PRIMARY KEY,
        label_time VARCHAR(10) NOT NULL,
        traffic_data INT NOT NULL
      )
    `);
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  }
}

export default { up };
