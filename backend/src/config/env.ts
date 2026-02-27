import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || '3333',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  FREE_TRIAL_DAYS: parseInt(process.env.FREE_TRIAL_DAYS || '15'),
  ENTERPRISE_PRICE: parseFloat(process.env.ENTERPRISE_PRICE || '39.90'),
};
