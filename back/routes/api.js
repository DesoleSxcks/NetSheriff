import express from 'express';
import pool from '../src/db.js';

const router = express.Router();

// Hosts
router.get('/hosts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hosts ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hosts/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hosts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hosts', async (req, res) => {
  try {
    const { id, name, address, category, status, uptime, last_checked_at } = req.body;
    await pool.query(
      'INSERT INTO hosts (id, name, address, category, status, uptime, last_checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, address, category || null, status || 'Unknown', uptime || 0, last_checked_at || null]
    );
    res.status(201).json({ message: 'created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/hosts/:id', async (req, res) => {
  try {
    const { name, address, category, status, uptime, last_checked_at } = req.body;
    await pool.query(
      `UPDATE hosts SET name = ?, address = ?, category = ?, status = ?, uptime = ?, last_checked_at = ? WHERE id = ?`,
      [name, address, category || null, status || 'Unknown', uptime || 0, last_checked_at || null, req.params.id]
    );
    res.json({ message: 'updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/hosts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM hosts WHERE id = ?', [req.params.id]);
    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ping checks
router.get('/hosts/:id/ping_checks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ping_checks WHERE host_id = ? ORDER BY checked_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hosts/:id/ping_checks', async (req, res) => {
  try {
    const h = req.params.id;
    const p = req.body;
    const [result] = await pool.query(
      `INSERT INTO ping_checks (host_id, checked_at, reachable, transmitted, received, min_ms, avg_ms, max_ms, stddev_ms, output, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        h,
        p.checked_at || new Date(),
        p.reachable ? 1 : 0,
        p.transmitted || 0,
        p.received || 0,
        p.min_ms || null,
        p.avg_ms || null,
        p.max_ms || null,
        p.stddev_ms || null,
        p.output || null,
        p.error || null,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
