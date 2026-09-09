const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 5432, user: 'postgres', password: 'user', database: 'omkareswar_realtors_test' });
c.connect().then(async () => {
  const cols = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'landing_leads' ORDER BY ordinal_position");
  console.log('TEST DB landing_leads cols:', cols.rows.map((r) => r.column_name).join(', '));
  const meta = await c.query("SELECT name FROM sequelizemeta ORDER BY name");
  console.log('sequelizemeta:', meta.rows.map((r) => r.name).join(', '));
  await c.end();
}).catch((e) => { console.log('ERR:', e.message); process.exit(1); });