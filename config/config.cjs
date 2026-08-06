require('dotenv').config();

const common = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
};

module.exports = {
  development: {
    ...common,
    database: process.env.DB_NAME || 'omkareswar_realtors',
  },
  test: {
    ...common,
    database: process.env.DB_TEST_NAME || 'omkareswar_realtors_test',
  },
  production: {
    ...common,
    database: process.env.DB_NAME || 'omkareswar_realtors',
    dialectOptions: process.env.DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  },
};
