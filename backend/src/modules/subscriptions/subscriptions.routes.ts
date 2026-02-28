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

// ROTA PÚBLICA (Sem middleware nenhum)
router.post('/webhook', handleWebhook);

// Rotas protegidas (Aplicamos o middleware individualmente em cada uma)
router.get('/', authMiddleware, getSubscription);
router.get('/limits', authMiddleware, checkLimits);
router.post('/create-pix', authMiddleware, createPix);
router.post('/upgrade', authMiddleware, requireAdmin, upgradeToEnterprise);
router.post('/renew', authMiddleware, requireAdmin, renewSubscription);

export default router;