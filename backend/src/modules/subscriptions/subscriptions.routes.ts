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

// 1. Rota PÚBLICA (Completamente isolada)
router.post('/webhook', handleWebhook);

// 2. Roteador Protegido (Criamos um sub-roteador apenas para o que precisa de auth)
const protectedRouter = Router();
protectedRouter.use(authMiddleware);

// Definimos as rotas protegidas no sub-roteador
protectedRouter.get('/', getSubscription);
protectedRouter.get('/limits', checkLimits);
protectedRouter.post('/create-pix', createPix);
protectedRouter.post('/upgrade', requireAdmin, upgradeToEnterprise);
protectedRouter.post('/renew', requireAdmin, renewSubscription);

// Montamos o sub-roteador no roteador principal
router.use('/', protectedRouter);

export default router;