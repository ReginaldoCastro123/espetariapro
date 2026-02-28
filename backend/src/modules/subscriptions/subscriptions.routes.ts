import { Router } from 'express';
import { 
  getSubscription, 
  upgradeToEnterprise, 
  renewSubscription, 
  checkLimits, 
  createPix,
  handleWebhook // Importando a nova função do webhook
} from './subscriptions.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';

const router = Router();

// ROTA PÚBLICA: Deve vir ANTES do authMiddleware
// O Mercado Pago chamará esta URL sem enviar token de usuário
router.post('/webhook', handleWebhook);

// Todas as rotas ABAIXO desta linha precisam de autenticação
router.use(authMiddleware);

// Rotas protegidas por autenticação
router.get('/', getSubscription);
router.get('/limits', checkLimits);
router.post('/create-pix', createPix);

// Rotas protegidas por autenticação E nível de administrador
router.post('/upgrade', requireAdmin, upgradeToEnterprise);
router.post('/renew', requireAdmin, renewSubscription);

export default router;