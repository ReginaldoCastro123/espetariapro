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

// 1. Rota PÚBLICA e ESPECÍFICA para o Webhook
router.post('/webhook', handleWebhook);

// 2. Proteção para as rotas que precisam de login
// Aplicamos o middleware apenas nas rotas que vêm abaixo
router.use(authMiddleware);

router.get('/', getSubscription);
router.get('/limits', checkLimits);
router.post('/create-pix', createPix);
router.post('/upgrade', requireAdmin, upgradeToEnterprise);
router.post('/renew', requireAdmin, renewSubscription);

export default router;