const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/settings
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM settings WHERE id = 1');
  res.json(result.rows[0]);
});

// PUT /api/settings
router.put('/', async (req, res) => {
  const fields = [
    'energy_rate', 'power_watts', 'printer_cost', 'printer_life_hours',
    'maintenance_pct', 'hourly_rate', 'failure_pct', 'margin_target',
    'cost_mode', 'include_packaging'
  ];
  const updates = [];
  const values = [];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      values.push(req.body[f]);
      updates.push(`${f} = $${values.length}`);
    }
  });
  if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

  values.push(1); // WHERE id = 1
  const query = `UPDATE settings SET ${updates.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING *`;
  const result = await pool.query(query, values);
  res.json(result.rows[0]);
});

module.exports = router;
