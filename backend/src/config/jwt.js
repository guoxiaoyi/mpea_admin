import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default_secret_key_please_change',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

