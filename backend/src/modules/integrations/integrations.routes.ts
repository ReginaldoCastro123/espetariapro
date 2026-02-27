import { Router } from 'express';
import { 
  getAvailableIntegrations, 
  createMercadoPagoPreference, 
  mercadoPagoWebhook,
  sendEmail,
  sendWhatsApp 
} from './integrations.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';

const router = Router();

// Rotas públicas (webhooks)
router.post('/webhooks/mercado-pago', mercadoPagoWebhook);

// Rotas protegidas
router.use(authMiddleware);

router.get('/', getAvailableIntegrations);
router.post('/mercado-pago/preference', requireAdmin, createMercadoPagoPreference);
router.post('/email', requireAdmin, sendEmail);
router.post('/whatsapp', requireAdmin, sendWhatsApp);

export default router;
