const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { computeCost, tierPricing, channelPricing } = require('../utils/costEngine');

const router = express.Router();
router.use(requireAuth);

async function getContext(filamentTypeId) {
  const [settingsRes, filamentRes, packagingRes, channelsRes] = await Promise.all([
    pool.query('SELECT * FROM settings WHERE id = 1'),
    pool.query('SELECT * FROM filament_types WHERE id = $1', [filamentTypeId]),
    pool.query('SELECT * FROM packaging_items'),
    pool.query('SELECT * FROM channels'),
  ]);
  return {
    settings: settingsRes.rows[0],
    filament: filamentRes.rows[0],
    packagingItems: packagingRes.rows,
    channels: channelsRes.rows,
  };
}

// ---------------------------------------------------------
// POST /api/products/calc
// Calcula o custo SEM salvar — usado pela tela da calculadora.
// Body: { grams, hours, minutes, manualHours, filamentTypeId, marginTarget? }
// ---------------------------------------------------------
router.post('/calc', async (req, res) => {
  try {
    const { grams, hours, minutes, manualHours, filamentTypeId } = req.body;
    if (!filamentTypeId) return res.status(400).json({ error: 'Selecione o tipo de filamento.' });

    const { settings, filament, packagingItems, channels } = await getContext(filamentTypeId);
    if (!filament) return res.status(404).json({ error: 'Tipo de filamento não encontrado.' });

    const result = computeCost(
      { grams, hours, minutes, manualHours, filamentPricePerKg: filament.price_per_kg },
      settings,
      packagingItems,
      settings.include_packaging
    );

    const activeCost = settings.cost_mode === 'com_fixo' ? result.costComFixo : result.costSemFixo;

    const tiers = [
      { label: 'Mínimo (cobertura de custos)', mult: 1.5 },
      { label: 'Recomendado (lucro saudável)', mult: 2 },
      { label: 'Premium (posicionamento alto)', mult: 3 },
    ].map((t) => ({ label: t.label, ...tierPricing(activeCost, t.mult) }));

    const channelPrices = channels.map((ch) => ({
      channel: ch,
      ...channelPricing(activeCost, settings.margin_target, Number(ch.commission), Number(ch.fixed_fee)),
    }));

    res.json({
      ...result,
      activeCost,
      filament,
      costMode: settings.cost_mode,
      tiers,
      channelPrices,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao calcular custo.' });
  }
});

// ---------------------------------------------------------
// GET /api/products
// ---------------------------------------------------------
router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, f.name AS filament_name, f.price_per_kg AS filament_price_per_kg
    FROM products p
    LEFT JOIN filament_types f ON f.id = p.filament_type_id
    ORDER BY p.created_at DESC
  `);
  res.json(result.rows);
});

// ---------------------------------------------------------
// POST /api/products  — salva o produto com o custo já calculado
// ---------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { name, grams, hours, minutes, manualHours, filamentTypeId } = req.body;
    if (!name || !grams || !filamentTypeId) {
      return res.status(400).json({ error: 'Nome, gramas e tipo de filamento são obrigatórios.' });
    }

    const { settings, filament, packagingItems } = await getContext(filamentTypeId);
    if (!filament) return res.status(404).json({ error: 'Tipo de filamento não encontrado.' });

    const result = computeCost(
      { grams, hours, minutes, manualHours, filamentPricePerKg: filament.price_per_kg },
      settings, packagingItems, settings.include_packaging
    );
    const costTotal = settings.cost_mode === 'com_fixo' ? result.costComFixo : result.costSemFixo;

    // Gera o próximo código PRD-000X
    const seqRes = await pool.query(`SELECT count(*)::int AS n FROM products`);
    const code = 'PRD-' + String(seqRes.rows[0].n + 1).padStart(4, '0');

    const insertRes = await pool.query(
      `INSERT INTO products (code, name, grams, hours, minutes, manual_hours, filament_type_id, cost_mode, cost_total, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [code, name.trim(), grams, hours || 0, minutes || 0, manualHours || 0, filamentTypeId, settings.cost_mode, costTotal, req.user.id]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar produto.' });
  }
});

// PUT /api/products/:id  — ex: renomear
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const result = await pool.query(
    'UPDATE products SET name = COALESCE($1,name), updated_at = now() WHERE id = $2 RETURNING *',
    [name, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado.' });
  res.json(result.rows[0]);
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ deleted: true });
});

module.exports = router;
