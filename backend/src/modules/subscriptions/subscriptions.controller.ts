import { Request, Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { env } from '../../config/env';
import { addMonths } from 'date-fns';
import { Payment, MercadoPagoConfig } from 'mercadopago';

// Configuração do cliente Mercado Pago
const client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN || '' });

export const getSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { companyId: req.user!.companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      res.status(404).json({ error: 'Assinatura não encontrada' });
      return;
    }

    const [tableCount, userCount] = await Promise.all([
      prisma.table.count({ where: { companyId: req.user!.companyId } }),
      prisma.user.count({ where: { companyId: req.user!.companyId } }),
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

export const createPix = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, whatsapp, document } = req.body;
    const payment = new Payment(client);

    const body = {
      transaction_amount: 39.90, // Valor do plano Enterprise
      description: 'Assinatura EspetariaPro Enterprise',
      payment_method_id: 'pix',
      payer: {
        email: req.user!.email,
        first_name: name,
        identification: { type: 'CPF', number: document.replace(/\D/g, '') }
      },
    };

    const result = await payment.create({ body });

    res.json({
      pixCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento via PIX' });
  }
};

export const upgradeToEnterprise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const currentSubscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (currentSubscription?.plan === 'ENTERPRISE' && currentSubscription.status === 'ACTIVE') {
      res.status(400).json({ error: 'Empresa já possui plano Enterprise ativo' });
      return;
    }

    const startDate = new Date();
    const endDate = addMonths(startDate, 1);

    const subscription = await prisma.subscription.create({
      data: { companyId, plan: 'ENTERPRISE', status: 'ACTIVE', startDate, endDate },
    });

    res.json({
      message: 'Assinatura Enterprise ativada com sucesso',
      subscription: { ...subscription, price: env.ENTERPRISE_PRICE },
    });
  } catch (error) {
    console.error('Erro ao fazer upgrade:', error);
    res.status(500).json({ error: 'Erro ao fazer upgrade da assinatura' });
  }
};

export const renewSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const currentSubscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSubscription || currentSubscription.plan !== 'ENTERPRISE') {
      res.status(400).json({ error: 'Nenhuma assinatura Enterprise encontrada' });
      return;
    }

    const startDate = new Date();
    const endDate = addMonths(startDate, 1);

    const subscription = await prisma.subscription.create({
      data: { companyId, plan: 'ENTERPRISE', status: 'ACTIVE', startDate, endDate },
    });

    res.json({
      message: 'Assinatura renovada com sucesso',
      subscription: { ...subscription, price: env.ENTERPRISE_PRICE },
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

    res.json({ plan: subscription.plan, status: subscription.status, limits });
  } catch (error) {
    console.error('Erro ao verificar limites:', error);
    res.status(500).json({ error: 'Erro ao verificar limites' });
  }
};

export const checkExpiredSubscriptions = async (): Promise<void> => {
  try {
    const now = new Date();
    const expiredTrials = await prisma.subscription.findMany({
      where: { status: 'TRIAL', endDate: { lt: now } },
    });

    for (const sub of expiredTrials) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } });
    }
  } catch (error) {
    console.error('Erro ao verificar assinaturas expiradas:', error);
  }
};