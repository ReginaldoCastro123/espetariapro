import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  companyId: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  // Passamos o segredo e as opções de forma explícita e simplificada
  return jwt.sign(payload, env.JWT_SECRET as string, { 
    expiresIn: env.JWT_EXPIRES_IN as any 
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as string, { 
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any 
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET as string) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET as string) as TokenPayload;
};