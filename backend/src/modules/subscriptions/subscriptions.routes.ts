import { Router } from 'express';
import { 
  getSubscription, 
  checkLimits, 
  createPix,
  handleWebhook 
} from './subscriptions.controller';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

// 1. Rota Única Pública (Apenas o Mercado Pago acessa)
router.post('/webhook', handleWebhook);

// 2. Rotas protegidas (Apenas consultas e geração do código PIX)
router.get('/', authMiddleware, getSubscription);
router.get('/limits', authMiddleware, checkLimits);
router.post('/create-pix', authMiddleware, createPix);

export default router;