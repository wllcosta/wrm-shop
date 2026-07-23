// Ponto de entrada usado pela Vercel. Reaproveita o mesmo app Express
// do backend — a Vercel só chama essa função a cada request, sem
// precisar de um servidor rodando o tempo todo (por isso não "dorme"
// nem cai como acontecia nos free tiers anteriores).
require('dotenv').config();
const app = require('../backend/app');

module.exports = app;
