import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../config/database';
import { addDays, isAfter } from 'date-fns';

export const checkSubscription = (action: 'read' | 'write' | 'admin' = 'read') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const subscription = await prisma.subscription.findFirst({
        where: {
          companyId: req.user.companyId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!subscription) {
        res.status(403).json({ 
          error: 'ASSINATURA_EXPIRADA',
          message: 'Nenhuma assinatura encontrada. Por favor, assine um plano.'
        });
        return;
      }

      // Verifica se a assinatura está expirada
      if (subscription.status === 'EXPIRED') {
        res.status(403).json({ 
          error: 'ASSINATURA_EXPIRADA',
          message: 'Sua assinatura expirou. Renove para continuar usando o sistema.'
        });
        return;
      }

      // Verifica se o trial expirou
      if (subscription.status === 'TRIAL' && subscription.endDate) {
        if (isAfter(new Date(), subscription.endDate)) {
          // Atualiza o status para expirado
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'EXPIRED' }
          });

          res.status(403).json({ 
            error: 'ASSINATURA_EXPIRADA',
            message: 'Seu período de trial expirou. Assine o plano Enterprise para continuar.'
          });
          return;
        }
      }

      // Para ações de escrita, verifica limites do plano FREE
      if (action === 'write' && subscription.plan === 'FREE') {
        const company = await prisma.company.findUnique({
          where: { id: req.user.companyId },
          include: {
            _count: {
              select: {
                tables: { where: { status: 'OPEN' } },
                users: true,
              }
            }
          }
        });

        if (company) {
          // Verifica limite de mesas abertas (máx 10 no FREE)
          if (company._count.tables >= 10) {
            res.status(403).json({ 
              error: 'LIMITE_EXCEDIDO',
              message: 'Limite de 10 mesas ativas atingido. Faça upgrade para Enterprise.'
            });
            return;
          }
        }
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      res.status(500).json({ error: 'Erro ao verificar assinatura' });
    }
  };
};

export const requireActiveSubscription = checkSubscription('write');
