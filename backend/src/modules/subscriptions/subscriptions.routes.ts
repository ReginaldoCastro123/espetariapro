import { Router } from 'express';
import { 
  getSubscription, 
  upgradeToEnterprise, 
  renewSubscription, 
  checkLimits, 
  createPix,
  handleWebhook 
} from './subscriptions.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';

const router = Router();

// 1. Rota Única Pública (Absolutamente NADA antes dela)
router.post('/webhook', handleWebhook);

// 2. Rotas protegidas (Middleware aplicado diretamente na rota)
router.get('/', authMiddleware, getSubscription);
router.get('/limits', authMiddleware, checkLimits);
router.post('/create-pix', authMiddleware, createPix);
router.post('/upgrade', authMiddleware, requireAdmin, upgradeToEnterprise);
router.post('/renew', authMiddleware, requireAdmin, renewSubscription);

export default router;