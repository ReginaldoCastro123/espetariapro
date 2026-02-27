import { Router } from 'express';
import { body } from 'express-validator';
import { listTables, getTable, createTable, updateTable, deleteTable, openTable, closeTable } from './tables.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';
import { checkSubscription } from '../../middlewares/subscription';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// Validações
const createValidation = [
  body('name').notEmpty().withMessage('Nome da mesa é obrigatório'),
];

const updateValidation = [
  body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
];

// Rotas
router.get('/', listTables);
router.get('/:id', getTable);
router.post('/', requireAdmin, createValidation, createTable);
router.put('/:id', requireAdmin, updateValidation, updateTable);
router.delete('/:id', requireAdmin, deleteTable);
router.post('/:id/open', checkSubscription('write'), openTable);
router.post('/:id/close', closeTable);

export default router;
