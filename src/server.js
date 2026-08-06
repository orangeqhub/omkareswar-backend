import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import sequelize from './config/database.js';
import { initSocket } from './sockets/index.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocket(httpServer);

async function start() {
  try {
    // 1. Environment loaded
    console.log('Environment loaded');

    // 2. Database connected
    await sequelize.authenticate();
    console.log('Database connected');

    // 3. Migrations verified
    // We check if the SequelizeMeta table exists
    const [metaTable] = await sequelize.query(
      "SELECT to_regclass('public.\"SequelizeMeta\"') AS exists"
    );
    if (!metaTable[0] || !metaTable[0].exists) {
      throw new Error('Migrations table SequelizeMeta does not exist. Run migrations first.');
    }
    console.log('Migrations verified');

    // 4. Seed status checked
    // We check if the users table has seeded admin user
    const [adminCheck] = await sequelize.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    if (adminCheck.length === 0) {
      throw new Error('Admin user seed not found. Run seeds first.');
    }
    console.log('Seed status checked');

    // Start server
    httpServer.listen(PORT, () => {
      // 5. Server listening
      console.log('Server listening');
      console.log(`OMKARESWAR REALTORS backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
}

start();

export default httpServer;
