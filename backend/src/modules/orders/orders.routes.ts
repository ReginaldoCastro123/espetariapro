import { Router } from 'express';
import { body } from 'express-validator';
import { listOrders, getOrder, createOrder, addItemsToOrder, closeOrder, cancelOrder } from './orders.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';
import { checkSubscription } from '../../middlewares/subscription';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// --- Validações (mantidas conforme seu original) ---
const createValidation = [
  body('tableId').notEmpty().withMessage('ID da mesa é obrigatório'),
  body('items').isArray({ min: 1 }).withMessage('Itens do pedido são obrigatórios'),
  body('items.*.productId').notEmpty().withMessage('ID do produto é obrigatório'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser pelo menos 1'),
];

const addItemsValidation = [
  body('items').isArray({ min: 1 }).withMessage('Itens são obrigatórios'),
  body('items.*.productId').notEmpty().withMessage('ID do produto é obrigatório'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser pelo menos 1'),
];

// --- Rotas Protegidas ---

// Listar e buscar pedidos (apenas leitura)
router.get('/', checkSubscription('read'), listOrders);
router.get('/:id', checkSubscription('read'), getOrder);

// Criar pedido (escrita - verifica limite de mesas ativas)
router.post('/', checkSubscription('write'), createValidation, createOrder);

// Adicionar itens (escrita)
router.post('/:id/items', checkSubscription('write'), addItemsValidation, addItemsToOrder);

// Fechar conta (escrita)
router.post('/:id/close', checkSubscription('write'), closeOrder);

// Cancelar pedido (ação administrativa + escrita)
router.post('/:id/cancel', checkSubscription('write'), requireAdmin, cancelOrder);

export default router;