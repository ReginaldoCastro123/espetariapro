import { Router } from 'express';
import { 
  getSubscription, 
  upgradeToEnterprise, 
  renewSubscription, 
  checkLimits, 
  createPix,
  handleWebhook // Importe o webhook
} from './subscriptions.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';

const router = Router();

// 1. ROTA PÚBLICA (Deve ser declarada antes do middleware de autenticação)
router.post('/webhook', handleWebhook);

// 2. Middleware de autenticação aplicado APENAS às rotas abaixo
router.use(authMiddleware);

// 3. Rotas protegidas
router.get('/', getSubscription);
router.get('/limits', checkLimits);
router.post('/create-pix', createPix);
router.post('/upgrade', requireAdmin, upgradeToEnterprise);
router.post('/renew', requireAdmin, renewSubscription);

export default router;