// Conexão com o Postgres (Neon).
// DATABASE_URL vem das variáveis de ambiente (.env local ou Vercel).
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('[db] ATENÇÃO: variável DATABASE_URL não definida.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon exige SSL. Em produção, mantenha rejectUnauthorized true se possível;
  // Neon geralmente funciona bem com o modo abaixo.
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
