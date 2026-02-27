import { MercadoPagoConfig } from 'mercadopago';
import { env } from './env';

export const client = new MercadoPagoConfig({ 
  accessToken: env.MP_ACCESS_TOKEN || '' // Se for undefined, usa string vazia
});