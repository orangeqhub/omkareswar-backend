import dotenv from 'dotenv';

dotenv.config();
process.env.NODE_ENV = 'test';
delete process.env.UPLOAD_BASE_URL;
