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
    const companyId = req.user!.companyId;

    if (!document || !name) {
      res.status(400).json({ error: 'Nome e CPF/CNPJ são obrigatórios.' });
      return;
    }

    const payment = new Payment(client);
    const cleanDocument = document.replace(/\D/g, '');

    const body = {
      transaction_amount: 0.01, // VALOR REAL DO PIX (Mude para o valor final em produção)
      description: 'Assinatura EspetariaPro Enterprise',
      payment_method_id: 'pix',
      external_reference: companyId, // Identificador vital para o webhook
      payer: {
        email: req.user?.email || 'cliente@exemplo.com',
        first_name: name,
        identification: { 
          type: cleanDocument.length > 11 ? 'CNPJ' : 'CPF', 
          number: cleanDocument 
        }
      },
    };

    const result = await payment.create({ body });

    res.json({
      pixCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64
    });
  } catch (error: any) {
    console.error('Erro ao gerar PIX:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Erro ao processar pagamento via PIX' });
  }
};

// Webhook blindado que processa o pagamento e ativa o plano
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, action } = req.body;

    if (action === 'payment.updated' || action === 'payment.created') {
      const paymentId = data.id;
      const payment = new Payment(client);
      const paymentDetails = await payment.get({ id: paymentId });

      if (paymentDetails.status === 'approved') {
        const companyId = paymentDetails.external_reference;
        
        if (companyId) {
          const startDate = new Date();
          const endDate = addMonths(startDate, 1); // Dá 1 mês a partir do pagamento
          
          await prisma.subscription.create({
            data: { 
              companyId, 
              plan: 'ENTERPRISE', 
              status: 'ACTIVE', 
              startDate, 
              endDate 
            },
          });
          console.log(`Assinatura ativada via Webhook para empresa: ${companyId}`);
        }
      }
    }
    res.status(200).send('Webhook processado');
  } catch (error) {
    console.error('Erro no Webhook:', error);
    res.status(500).send('Erro interno');
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