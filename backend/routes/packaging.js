const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM packaging_items ORDER BY name ASC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, cost } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });
  const result = await pool.query(
    'INSERT INTO packaging_items (name, cost) VALUES ($1,$2) RETURNING *',
    [name.trim(), cost || 0]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, cost } = req.body;
  const result = await pool.query(
    'UPDATE packaging_items SET name = COALESCE($1,name), cost = COALESCE($2,cost) WHERE id = $3 RETURNING *',
    [name, cost, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado.' });
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM packaging_items WHERE id = $1', [req.params.id]);
  res.json({ deleted: true });
});

module.exports = router;
