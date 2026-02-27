import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/database';
import { hashPassword } from '../../utils/password';
import { AuthRequest } from '../../middlewares/auth';

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: {
        companyId: req.user!.companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password, role } = req.body;

    // Verifica se email já existe na empresa
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        companyId: req.user!.companyId,
      },
    });

    if (existingUser) {
      res.status(400).json({ error: 'E-mail já cadastrado nesta empresa' });
      return;
    }

    // Verifica limite de usuários no plano FREE
    const subscription = await prisma.subscription.findFirst({
      where: { companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (subscription?.plan === 'FREE') {
      const userCount = await prisma.user.count({
        where: { companyId: req.user!.companyId },
      });

      if (userCount >= 5) {
        res.status(403).json({
          error: 'LIMITE_EXCEDIDO',
          message: 'Limite de 5 usuários atingido no plano FREE. Faça upgrade para Enterprise.',
        });
        return;
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        companyId: req.user!.companyId,
        name,
        email,
        password: hashedPassword,
        role: role || 'WAITER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { name, email, role, active } = req.body;

    // Verifica se usuário existe e pertence à empresa
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Não permite desativar o próprio usuário admin
    if (existingUser.id === req.user!.userId && active === false) {
      res.status(400).json({ error: 'Não é possível desativar seu próprio usuário' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        active,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verifica se usuário existe e pertence à empresa
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Não permite excluir o próprio usuário
    if (existingUser.id === req.user!.userId) {
      res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
      return;
    }

    // Verifica se usuário existe e pertence à empresa
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!existingUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
};
