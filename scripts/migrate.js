// Executa o schema.sql contra o banco definido em DATABASE_URL.
// Uso: npm run db:migrate
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../backend/db/pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../backend/db/schema.sql'), 'utf8');
  console.log('Aplicando schema.sql...');
  await pool.query(sql);
  console.log('✅ Schema aplicado com sucesso.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Erro ao aplicar schema:', err);
  process.exit(1);
});
