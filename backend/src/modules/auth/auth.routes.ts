import { Router } from 'express';
import { body } from 'express-validator';
import { registerCompany, login, refreshToken, getMe } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

// Validações
const registerValidation = [
  body('companyName').notEmpty().withMessage('Nome da empresa é obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('adminName').notEmpty().withMessage('Nome do administrador é obrigatório'),
];

const loginValidation = [
  body('email').isEmail().withMessage('E-mail inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

// Rotas
router.post('/register', registerValidation, registerCompany);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;
