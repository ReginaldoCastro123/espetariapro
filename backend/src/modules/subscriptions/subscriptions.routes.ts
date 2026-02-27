import { Router } from 'express';
import { getSubscription, upgradeToEnterprise, renewSubscription, checkLimits } from './subscriptions.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// Rotas
router.get('/', getSubscription);
router.get('/limits', checkLimits);
router.post('/upgrade', requireAdmin, upgradeToEnterprise);
router.post('/renew', requireAdmin, renewSubscription);

export default router;
