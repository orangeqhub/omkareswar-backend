import pg from 'pg';
const c = new pg.Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'user', database: 'omkareswar_realtors' });
await c.connect();
await c.query('DELETE FROM "SequelizeMeta" WHERE name = ?', { replacements: ['20260101000023-add-user-temp-password-and-sync-employee-form.cjs'] });
console.log('removed migration row');
await c.end();
