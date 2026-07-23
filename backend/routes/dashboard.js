const express = require('express');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { saleFees } = require('../utils/costEngine');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT s.*, p.name AS product_name, c.name AS channel_name, c.commission, c.fixed_fee
    FROM sales s
    LEFT JOIN products p ON p.id = s.product_id
    LEFT JOIN channels c ON c.id = s.channel_id
  `);

  let revenue = 0, profit = 0, units = 0;
  const byProduct = {};
  const byChannel = {};

  result.rows.forEach((s) => {
    const { revenue: rev, totalFees } = saleFees(Number(s.price), Number(s.qty), s);
    const totalCost = Number(s.unit_cost) * Number(s.qty);
    const p = rev - totalFees - totalCost;

    revenue += rev;
    profit += p;
    units += Number(s.qty);

    byProduct[s.product_name] = (byProduct[s.product_name] || 0) + p;
    byChannel[s.channel_name] = (byChannel[s.channel_name] || 0) + rev;
  });

  const bestProduct = Object.entries(byProduct).sort((a, b) => b[1] - a[1])[0] || null;
  const margin = revenue > 0 ? profit / revenue : 0;

  res.json({
    revenue, profit, margin, units,
    bestProduct: bestProduct ? { name: bestProduct[0], profit: bestProduct[1] } : null,
    revenueByChannel: byChannel,
  });
});

module.exports = router;
