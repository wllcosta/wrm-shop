const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM channels ORDER BY name ASC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { name, commission, fixed_fee } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });
  const result = await pool.query(
    'INSERT INTO channels (name, commission, fixed_fee) VALUES ($1,$2,$3) RETURNING *',
    [name.trim(), commission || 0, fixed_fee || 0]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, commission, fixed_fee } = req.body;
  const result = await pool.query(
    `UPDATE channels SET name = COALESCE($1,name), commission = COALESCE($2,commission),
     fixed_fee = COALESCE($3,fixed_fee) WHERE id = $4 RETURNING *`,
    [name, commission, fixed_fee, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado.' });
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM channels WHERE id = $1', [req.params.id]);
  res.json({ deleted: true });
});

module.exports = router;
