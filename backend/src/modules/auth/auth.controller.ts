import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { env } from '../../config/env';
import { addDays } from 'date-fns';

export const registerCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { companyName, email, password, adminName, phone } = req.body;

    // Verifica se empresa já existe
    const existingCompany = await prisma.company.findUnique({
      where: { email },
    });

    if (existingCompany) {
      res.status(400).json({ error: 'E-mail já cadastrado' });
      return;
    }

    // Cria a empresa
    const company = await prisma.company.create({
      data: {
        name: companyName,
        email,
        phone,
      },
    });

    // Cria o usuário admin
    const hashedPassword = await hashPassword(password);
    const admin = await prisma.user.create({
      data: {
        companyId: company.id,
        name: adminName,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Cria assinatura de trial
    const trialEndDate = addDays(new Date(), env.FREE_TRIAL_DAYS);
    await prisma.subscription.create({
      data: {
        companyId: company.id,
        plan: 'FREE',
        status: 'TRIAL',
        startDate: new Date(),
        endDate: trialEndDate,
      },
    });

    // Gera tokens
    const tokenPayload = {
      userId: admin.id,
      companyId: company.id,
      role: admin.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      message: 'Empresa cadastrada com sucesso',
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
      },
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      accessToken,
      refreshToken,
      trialEndsAt: trialEndDate,
    });
  } catch (error) {
    console.error('Erro ao registrar empresa:', error);
    res.status(500).json({ error: 'Erro ao registrar empresa' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      res.status(401).json({ error: 'E-mail ou senha incorretos' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'E-mail ou senha incorretos' });
      return;
    }

    if (!user.active) {
      res.status(401).json({ error: 'Usuário desativado' });
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });

    const tokenPayload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        email: user.company.email,
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
      } : null,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(401).json({ error: 'Refresh token não fornecido' });
      return;
    }

    const { verifyRefreshToken } = await import('../../utils/jwt');
    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.active) {
      res.status(401).json({ error: 'Usuário não encontrado ou desativado' });
      return;
    }

    const tokenPayload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);

    res.json({ accessToken });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(401).json({ error: 'Refresh token inválido ou expirado' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = req as any;

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      // REMOVIDO: include: { company: true } para não dar conflito com o select!
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!userData) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      user: userData,
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
      } : null,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
};