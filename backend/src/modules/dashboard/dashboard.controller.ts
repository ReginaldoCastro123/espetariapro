import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    
    const timeZone = 'America/Porto_Velho';
    
    const now = new Date();
    const todayZoned = toZonedTime(now, timeZone);

    const startOfTodayString = formatInTimeZone(now, timeZone, 'yyyy-MM-dd') + 'T00:00:00.000-04:00';
    const endOfTodayString = formatInTimeZone(now, timeZone, 'yyyy-MM-dd') + 'T23:59:59.999-04:00';
    
    const startOfToday = new Date(startOfTodayString);
    const endOfToday = new Date(endOfTodayString);

    const startOfCurrentMonth = startOfMonth(todayZoned);
    const endOfCurrentMonth = endOfMonth(todayZoned);

    const todaySales = await prisma.order.aggregate({
      where: {
        companyId,
        status: 'CLOSED',
        closedAt: { gte: startOfToday, lte: endOfToday },
      },
      _sum: { totalAmount: true },
    });

    const monthSales = await prisma.order.aggregate({
      where: {
        companyId,
        status: 'CLOSED',
        closedAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
      },
      _sum: { totalAmount: true },
    });

    const openTables = await prisma.table.count({
      where: { companyId, status: 'OPEN' },
    });

    const topProduct = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { companyId, status: 'CLOSED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1,
    });

    let topProductData = null;
    if (topProduct.length > 0 && topProduct[0].productId) {
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

    const paymentMethods = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { companyId, status: 'CLOSED', paymentMethod: { not: null } },
      _count: { paymentMethod: true },
      orderBy: { _count: { paymentMethod: 'desc' } },
      take: 1,
    });

    const salesByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(todayZoned, i);
      
      const dayStartString = formatInTimeZone(date, timeZone, 'yyyy-MM-dd') + 'T00:00:00.000-04:00';
      const dayEndString = formatInTimeZone(date, timeZone, 'yyyy-MM-dd') + 'T23:59:59.999-04:00';
      
      const dayStart = new Date(dayStartString);
      const dayEnd = new Date(dayEndString);

      const daySales = await prisma.order.aggregate({
        where: {
          companyId,
          status: 'CLOSED',
          closedAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      });

      salesByDay.push({
        date: format(date, 'yyyy-MM-dd'),
        dayName: format(date, 'EEE', { locale: ptBR }),
        total: Number(daySales._sum.totalAmount) || 0,
        orders: daySales._count.id,
      });
    }

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { companyId, status: 'CLOSED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductsDataRaw = await Promise.all(
      topProducts.map(async (item) => {
        if (!item.productId) return null;
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, category: true },
        });
        return product ? { ...product, totalSold: item._sum.quantity } : null;
      })
    );
    const topProductsData = topProductsDataRaw.filter(Boolean);

    const salesByPayment = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { companyId, status: 'CLOSED', paymentMethod: { not: null } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const paymentData = salesByPayment.map((item) => ({
      method: item.paymentMethod,
      total: Number(item._sum.totalAmount) || 0,
      count: item._count.id,
    }));

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
          ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
      } : null,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};