import { Request, Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { env } from '../../config/env';
import { addMonths, addDays } from 'date-fns';

export const getSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId: req.user!.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!subscription) {
      res.status(404).json({ error: 'Assinatura não encontrada' });
      return;
    }

    // Conta mesas e usuários
    const [tableCount, userCount] = await Promise.all([
      prisma.table.count({
        where: { companyId: req.user!.companyId },
      }),
      prisma.user.count({
        where: { companyId: req.user!.companyId },
      }),
    ]);

    const isExpired = subscription.status === 'EXPIRED' ||
      (subscription.endDate && new Date() > new Date(subscription.endDate));

    res.json({
      ...subscription,
      tableCount,
      userCount,
      isExpired,
      limits: {
        maxTables: subscription.plan === 'FREE' ? 10 : null,
        maxUsers: subscription.plan === 'FREE' ? 5 : null,
        historyDays: subscription.plan === 'FREE' ? 30 : null,
      },
      price: subscription.plan === 'ENTERPRISE' ? env.ENTERPRISE_PRICE : 0,
    });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ error: 'Erro ao buscar assinatura' });
  }
};

export const upgradeToEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;

    // Busca assinatura atual
    const currentSubscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (currentSubscription?.plan === 'ENTERPRISE' && currentSubscription.status === 'ACTIVE') {
      res.status(400).json({ error: 'Empresa já possui plano Enterprise ativo' });
      return;
    }

    // Cria nova assinatura Enterprise
    const startDate = new Date();
    const endDate = addMonths(startDate, 1);

    const subscription = await prisma.subscription.create({
      data: {
        companyId,
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    res.json({
      message: 'Assinatura Enterprise ativada com sucesso',
      subscription: {
        ...subscription,
        price: env.ENTERPRISE_PRICE,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer upgrade:', error);
    res.status(500).json({ error: 'Erro ao fazer upgrade da assinatura' });
  }
};

export const renewSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;

    // Busca assinatura atual
    const currentSubscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSubscription || currentSubscription.plan !== 'ENTERPRISE') {
      res.status(400).json({ error: 'Nenhuma assinatura Enterprise encontrada' });
      return;
    }

    // Renova por mais 1 mês a partir da data atual ou data de término
    const startDate = new Date();
    const endDate = addMonths(startDate, 1);

    const subscription = await prisma.subscription.create({
      data: {
        companyId,
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    res.json({
      message: 'Assinatura renovada com sucesso',
      subscription: {
        ...subscription,
        price: env.ENTERPRISE_PRICE,
      },
    });
  } catch (error) {
    console.error('Erro ao renovar assinatura:', error);
    res.status(500).json({ error: 'Erro ao renovar assinatura' });
  }
};

export const checkLimits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;

    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      res.status(404).json({ error: 'Assinatura não encontrada' });
      return;
    }

    const [tableCount, openTableCount, userCount] = await Promise.all([
      prisma.table.count({ where: { companyId } }),
      prisma.table.count({ where: { companyId, status: 'OPEN' } }),
      prisma.user.count({ where: { companyId } }),
    ]);

    const limits = {
      tables: {
        current: tableCount,
        open: openTableCount,
        max: subscription.plan === 'FREE' ? 10 : null,
        hasReachedLimit: subscription.plan === 'FREE' && openTableCount >= 10,
      },
      users: {
        current: userCount,
        max: subscription.plan === 'FREE' ? 5 : null,
        hasReachedLimit: subscription.plan === 'FREE' && userCount >= 5,
      },
    };

    res.json({
      plan: subscription.plan,
      status: subscription.status,
      limits,
    });
  } catch (error) {
    console.error('Erro ao verificar limites:', error);
    res.status(500).json({ error: 'Erro ao verificar limites' });
  }
};

// Função para verificar e atualizar assinaturas expiradas (pode ser chamada por cron job)
export const checkExpiredSubscriptions = async (): Promise<void> => {
  try {
    const now = new Date();

    // Busca assinaturas trial expiradas
    const expiredTrials = await prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        endDate: {
          lt: now,
        },
      },
    });

    // Atualiza para expirado
    for (const sub of expiredTrials) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
    }

    console.log(`${expiredTrials.length} assinaturas trial expiradas atualizadas`);
  } catch (error) {
    console.error('Erro ao verificar assinaturas expiradas:', error);
  }
};
