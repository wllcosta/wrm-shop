const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/filament-types
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM filament_types ORDER BY name ASC');
  res.json(result.rows);
});

// POST /api/filament-types  { name, price_per_kg }
router.post('/', async (req, res) => {
  const { name, price_per_kg } = req.body;
  if (!name || price_per_kg === undefined) {
    return res.status(400).json({ error: 'Nome e preço por kg são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO filament_types (name, price_per_kg) VALUES ($1,$2) RETURNING *',
      [name.trim(), price_per_kg]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe um filamento com esse nome.' });
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar tipo de filamento.' });
  }
});

// PUT /api/filament-types/:id  { name?, price_per_kg?, is_active? }
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price_per_kg, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE filament_types
       SET name = COALESCE($1, name),
           price_per_kg = COALESCE($2, price_per_kg),
           is_active = COALESCE($3, is_active),
           updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [name, price_per_kg, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar tipo de filamento.' });
  }
});

// DELETE /api/filament-types/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Se houver produtos usando esse filamento, apenas desativa em vez de apagar.
    const inUse = await pool.query('SELECT 1 FROM products WHERE filament_type_id = $1 LIMIT 1', [id]);
    if (inUse.rows.length > 0) {
      await pool.query('UPDATE filament_types SET is_active = false, updated_at = now() WHERE id = $1', [id]);
      return res.json({ deactivated: true });
    }
    await pool.query('DELETE FROM filament_types WHERE id = $1', [id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover tipo de filamento.' });
  }
});

module.exports = router;
