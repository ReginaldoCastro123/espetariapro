import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    // Total vendido hoje
    const todaySales = await prisma.order.aggregate({
      where: {
        companyId,
        status: 'CLOSED',
        closedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Total vendido no mês
    const monthSales = await prisma.order.aggregate({
      where: {
        companyId,
        status: 'CLOSED',
        closedAt: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Mesas abertas
    const openTables = await prisma.table.count({
      where: {
        companyId,
        status: 'OPEN',
      },
    });

    // Produto mais vendido
    const topProduct = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          companyId,
          status: 'CLOSED',
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 1,
    });

    let topProductData = null;
    if (topProduct.length > 0 && topProduct[0].productId) { // Blindado contra produto null
      const product = await prisma.product.findUnique({
        where: { id: topProduct[0].productId },
        select: { id: true, name: true, category: true },
      });
      if (product) {
        topProductData = {
          ...product,
          totalSold: topProduct[0]._sum.quantity,
        };
      }
    }

    // Forma de pagamento mais usada
    const paymentMethods = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        companyId,
        status: 'CLOSED',
        paymentMethod: { not: null },
      },
      _count: {
        paymentMethod: true,
      },
      orderBy: {
        _count: {
          paymentMethod: 'desc',
        },
      },
      take: 1,
    });

    // Vendas por dia (últimos 7 dias)
    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const daySales = await prisma.order.aggregate({
        where: {
          companyId,
          status: 'CLOSED',
          closedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      });

      salesByDay.push({
        date: format(date, 'yyyy-MM-dd'),
        dayName: format(date, 'EEE', { locale: ptBR }),
        total: Number(daySales._sum.totalAmount) || 0,
        orders: daySales._count.id,
      });
    }

    // Produtos mais vendidos (top 5)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          companyId,
          status: 'CLOSED',
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProductsDataRaw = await Promise.all(
      topProducts.map(async (item) => {
        if (!item.productId) return null; // Prevenção extra
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, category: true },
        });
        return product ? {
          ...product,
          totalSold: item._sum.quantity,
        } : null;
      })
    );
    const topProductsData = topProductsDataRaw.filter(Boolean);

    // Vendas por forma de pagamento
    const salesByPayment = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        companyId,
        status: 'CLOSED',
        paymentMethod: { not: null },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const paymentData = salesByPayment.map((item) => ({
      method: item.paymentMethod,
      total: Number(item._sum.totalAmount) || 0,
      count: item._count.id,
    }));

    // Informações da assinatura
    const subscription = await prisma.subscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      todaySales: Number(todaySales._sum.totalAmount) || 0,
      monthSales: Number(monthSales._sum.totalAmount) || 0,
      openTables,
      topProduct: topProductData,
      topPaymentMethod: paymentMethods[0]?.paymentMethod || null,
      salesByDay,
      topProducts: topProductsData,
      salesByPayment: paymentData,
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
        daysRemaining: subscription.endDate
          ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
      } : null,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

export const getSalesByWaiter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { startDate, endDate } = req.query;

    const where: any = {
      companyId,
      status: 'CLOSED',
    };

    if (startDate || endDate) {
      where.closedAt = {};
      if (startDate) where.closedAt.gte = new Date(startDate as string);
      if (endDate) where.closedAt.lte = new Date(endDate as string);
    }

    const salesByWaiter = await prisma.order.groupBy({
      by: ['waiterId'],
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const resultRaw = await Promise.all(
      salesByWaiter.map(async (item) => {
        if (!item.waiterId) return null;
        const waiter = await prisma.user.findUnique({
          where: { id: item.waiterId },
          select: { id: true, name: true },
        });
        return waiter ? {
          waiter,
          totalSales: Number(item._sum.totalAmount) || 0,
          orderCount: item._count.id,
        } : null;
      })
    );

    res.json(resultRaw.filter(Boolean));
  } catch (error) {
    console.error('Erro ao buscar vendas por garçom:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas por garçom' });
  }
};