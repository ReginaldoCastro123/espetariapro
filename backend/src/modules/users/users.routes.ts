import { Router } from 'express';
import { body } from 'express-validator';
import { listUsers, createUser, updateUser, deleteUser, resetPassword } from './users.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/roles';

const router = Router();

// Todas as rotas precisam de autenticação e ser admin
router.use(authMiddleware);
router.use(requireAdmin);

// Validações
const createValidation = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('role').isIn(['ADMIN', 'WAITER']).withMessage('Função inválida'),
];

const updateValidation = [
  body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('email').optional().isEmail().withMessage('E-mail inválido'),
  body('role').optional().isIn(['ADMIN', 'WAITER']).withMessage('Função inválida'),
];

// Rotas
router.get('/', listUsers);
router.post('/', createValidation, createUser);
router.put('/:id', updateValidation, updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetPassword);

export default router;
