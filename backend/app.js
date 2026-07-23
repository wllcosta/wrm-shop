const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const filamentTypesRoutes = require('./routes/filamentTypes');
const settingsRoutes = require('./routes/settings');
const packagingRoutes = require('./routes/packaging');
const channelsRoutes = require('./routes/channels');
const productsRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/filament-types', filamentTypesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/packaging', packagingRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 padrão pra rotas de API não encontradas
app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

module.exports = app;
