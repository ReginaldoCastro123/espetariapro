import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';

export const listTables = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const where: any = {
      companyId: req.user!.companyId,
    };

    if (status) {
      where.status = status as string;
    }

    const tables = await prisma.table.findMany({
      where,
      include: {
        orders: {
          where: {
            status: 'OPEN',
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(tables);
  } catch (error) {
    console.error('Erro ao listar mesas:', error);
    res.status(500).json({ error: 'Erro ao listar mesas' });
  }
};

export const getTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
      include: {
        orders: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            waiter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!table) {
      res.status(404).json({ error: 'Mesa não encontrada' });
      return;
    }

    res.json(table);
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    res.status(500).json({ error: 'Erro ao buscar mesa' });
  }
};

export const createTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name } = req.body;

    // Verifica se já existe mesa com esse nome
    const existingTable = await prisma.table.findFirst({
      where: {
        name,
        companyId: req.user!.companyId,
      },
    });

    if (existingTable) {
      res.status(400).json({ error: 'Já existe uma mesa com esse nome' });
      return;
    }

    const table = await prisma.table.create({
      data: {
        companyId: req.user!.companyId,
        name,
        status: 'CLOSED',
        totalAmount: 0,
      },
    });

    res.status(201).json(table);
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    res.status(500).json({ error: 'Erro ao criar mesa' });
  }
};

export const updateTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { name } = req.body;

    // Verifica se mesa existe e pertence à empresa
    const existingTable = await prisma.table.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!existingTable) {
      res.status(404).json({ error: 'Mesa não encontrada' });
      return;
    }

    // Verifica se novo nome já existe
    if (name && name !== existingTable.name) {
      const nameExists = await prisma.table.findFirst({
        where: {
          name,
          companyId: req.user!.companyId,
          id: { not: id },
        },
      });

      if (nameExists) {
        res.status(400).json({ error: 'Já existe uma mesa com esse nome' });
        return;
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data: { name },
    });

    res.json(table);
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    res.status(500).json({ error: 'Erro ao atualizar mesa' });
  }
};

export const deleteTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verifica se mesa existe e pertence à empresa
    const existingTable = await prisma.table.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!existingTable) {
      res.status(404).json({ error: 'Mesa não encontrada' });
      return;
    }

    // Não permite excluir mesa aberta
    if (existingTable.status === 'OPEN') {
      res.status(400).json({ error: 'Não é possível excluir uma mesa aberta' });
      return;
    }

    await prisma.table.delete({
      where: { id },
    });

    res.json({ message: 'Mesa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mesa:', error);
    res.status(500).json({ error: 'Erro ao excluir mesa' });
  }
};

export const openTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verifica se mesa existe e pertence à empresa
    const table = await prisma.table.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!table) {
      res.status(404).json({ error: 'Mesa não encontrada' });
      return;
    }

    if (table.status === 'OPEN') {
      res.status(400).json({ error: 'Mesa já está aberta' });
      return;
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        status: 'OPEN',
        totalAmount: 0,
      },
    });

    res.json(updatedTable);
  } catch (error) {
    console.error('Erro ao abrir mesa:', error);
    res.status(500).json({ error: 'Erro ao abrir mesa' });
  }
};

export const closeTable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    // Verifica se mesa existe e pertence à empresa
    const table = await prisma.table.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
      include: {
        orders: {
          where: {
            status: 'OPEN',
          },
        },
      },
    });

    if (!table) {
      res.status(404).json({ error: 'Mesa não encontrada' });
      return;
    }

    if (table.status === 'CLOSED') {
      res.status(400).json({ error: 'Mesa já está fechada' });
      return;
    }

    // Fecha todos os pedidos abertos da mesa
    if (table.orders.length > 0) {
      await prisma.order.updateMany({
        where: {
          tableId: id,
          status: 'OPEN',
        },
        data: {
          status: 'CLOSED',
          paymentMethod: paymentMethod || 'CASH',
          closedAt: new Date(),
        },
      });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        status: 'CLOSED',
        totalAmount: 0,
      },
    });

    res.json(updatedTable);
  } catch (error) {
    console.error('Erro ao fechar mesa:', error);
    res.status(500).json({ error: 'Erro ao fechar mesa' });
  }
};
