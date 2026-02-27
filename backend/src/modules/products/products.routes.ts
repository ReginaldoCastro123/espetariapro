import { Router } from 'express';
import { body } from 'express-validator';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories } from './products.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';
import { checkSubscription } from '../../middlewares/subscription';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// Validações
const createValidation = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('price').isFloat({ min: 0 }).withMessage('Preço deve ser um número positivo'),
  body('category').notEmpty().withMessage('Categoria é obrigatória'),
];

const updateValidation = [
  body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Preço deve ser um número positivo'),
];

// Rotas
router.get('/', listProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.post('/', requireAdmin, checkSubscription('write'), createValidation, createProduct);
router.put('/:id', requireAdmin, updateValidation, updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

export default router;
