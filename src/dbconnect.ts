import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const isCloud = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';

export const conn = createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lunch_delivery',
  waitForConnections: true,
  queueLimit: 0,
  ssl: isCloud ? { rejectUnauthorized: false } : undefined,
});
