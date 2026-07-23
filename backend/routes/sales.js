const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { saleFees } = require('../utils/costEngine');

const router = express.Router();
router.use(requireAuth);

// GET /api/sales?productId=&channelId=
router.get('/', async (req, res) => {
  const { productId, channelId } = req.query;
  const conditions = [];
  const values = [];
  if (productId) { values.push(productId); conditions.push(`s.product_id = $${values.length}`); }
  if (channelId) { values.push(channelId); conditions.push(`s.channel_id = $${values.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(`
    SELECT s.*, p.name AS product_name, c.name AS channel_name, c.commission, c.fixed_fee
    FROM sales s
    LEFT JOIN products p ON p.id = s.product_id
    LEFT JOIN channels c ON c.id = s.channel_id
    ${where}
    ORDER BY s.sale_date DESC, s.created_at DESC
  `, values);

  const rows = result.rows.map((s) => {
    const { revenue, totalFees } = saleFees(Number(s.price), Number(s.qty), s);
    const totalCost = Number(s.unit_cost) * Number(s.qty);
    const profit = revenue - totalFees - totalCost;
    const margin = revenue > 0 ? profit / revenue : 0;
    return { ...s, revenue, totalFees, totalCost, profit, margin };
  });

  res.json(rows);
});

// POST /api/sales  { productId, channelId, price, qty, saleDate }
router.post('/', async (req, res) => {
  try {
    const { productId, channelId, price, qty, saleDate } = req.body;
    if (!productId || !channelId || !price) {
      return res.status(400).json({ error: 'Produto, canal e preço são obrigatórios.' });
    }

    const productRes = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    const product = productRes.rows[0];
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });

    const seqRes = await pool.query('SELECT count(*)::int AS n FROM sales');
    const code = 'S-' + String(seqRes.rows[0].n + 1).padStart(4, '0');

    const insertRes = await pool.query(
      `INSERT INTO sales (code, product_id, channel_id, unit_cost, price, qty, sale_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7, CURRENT_DATE),$8) RETURNING *`,
      [code, productId, channelId, product.cost_total, price, qty || 1, saleDate || null, req.user.id]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar venda.' });
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM sales WHERE id = $1', [req.params.id]);
  res.json({ deleted: true });
});

module.exports = router;
