import { Router } from 'express';
import { getStats, getSalesByWaiter } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';

const router = Router();

// Todas as rotas precisam de autenticação e ser admin
router.use(authMiddleware);
router.use(requireAdmin);

// Rotas
router.get('/stats', getStats);
router.get('/sales-by-waiter', getSalesByWaiter);

export default router;
