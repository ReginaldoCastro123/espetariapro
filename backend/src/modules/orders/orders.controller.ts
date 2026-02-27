import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';

export const listOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, startDate, endDate } = req.query;

    const where: any = {
      companyId: req.user!.companyId,
    };

    if (status) {
      where.status = status as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        waiter: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
      include: {
        table: true,
        waiter: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { tableId, items } = req.body;

    // Verifica se mesa existe e pertence à empresa
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        companyId: req.user!.companyId,
      },
    });

    if (!table) {
      res.status(404).json({ error: 'Mesa não encontrada' });
      return;
    }

    if (table.status === 'CLOSED') {
      res.status(400).json({ error: 'Mesa está fechada. Abra a mesa primeiro.' });
      return;
    }

    // Calcula total e verifica produtos
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          companyId: req.user!.companyId,
          active: true,
        },
      });

      if (!product) {
        res.status(400).json({ error: `Produto ${item.productId} não encontrado ou inativo` });
        return;
      }

      const itemTotal = Number(product.price) * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Cria o pedido
    const order = await prisma.order.create({
      data: {
        tableId,
        companyId: req.user!.companyId,
        waiterId: req.user!.userId,
        status: 'OPEN',
        totalAmount,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        table: true,
        waiter: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Atualiza total da mesa
    await prisma.table.update({
      where: { id: tableId },
      data: {
        totalAmount: {
          increment: totalAmount,
        },
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};

export const addItemsToOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { items } = req.body;

    // Verifica se pedido existe e pertence à empresa
    const order = await prisma.order.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
        status: 'OPEN',
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado ou já fechado' });
      return;
    }

    // Calcula total e verifica produtos
    let additionalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          companyId: req.user!.companyId,
          active: true,
        },
      });

      if (!product) {
        res.status(400).json({ error: `Produto ${item.productId} não encontrado ou inativo` });
        return;
      }

      const itemTotal = Number(product.price) * item.quantity;
      additionalAmount += itemTotal;

      orderItemsData.push({
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Adiciona items ao pedido
    await prisma.orderItem.createMany({
      data: orderItemsData,
    });

    // Atualiza total do pedido
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        totalAmount: {
          increment: additionalAmount,
        },
      },
      include: {
        table: true,
        waiter: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Atualiza total da mesa
    await prisma.table.update({
      where: { id: order.tableId },
      data: {
        totalAmount: {
          increment: additionalAmount,
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Erro ao adicionar itens:', error);
    res.status(500).json({ error: 'Erro ao adicionar itens ao pedido' });
  }
};

export const closeOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    // Verifica se pedido existe e pertence à empresa
    const order = await prisma.order.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
        status: 'OPEN',
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado ou já fechado' });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CLOSED',
        paymentMethod: paymentMethod || 'CASH',
        closedAt: new Date(),
      },
      include: {
        table: true,
        waiter: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Erro ao fechar pedido:', error);
    res.status(500).json({ error: 'Erro ao fechar pedido' });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verifica se pedido existe e pertence à empresa
    const order = await prisma.order.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
        status: 'OPEN',
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado ou já fechado' });
      return;
    }

    // Atualiza total da mesa (subtrai o valor do pedido)
    await prisma.table.update({
      where: { id: order.tableId },
      data: {
        totalAmount: {
          decrement: Number(order.totalAmount),
        },
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        closedAt: new Date(),
      },
      include: {
        table: true,
        waiter: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    res.status(500).json({ error: 'Erro ao cancelar pedido' });
  }
};
