import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';

export const listProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, active } = req.query;

    const where: any = {
      companyId: req.user!.companyId,
    };

    if (category) {
      where.category = category as string;
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    res.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
};

export const getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, price, category } = req.body;

    const product = await prisma.product.create({
      data: {
        companyId: req.user!.companyId,
        name,
        price: parseFloat(price),
        category,
        active: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { name, price, category, active } = req.body;

    // Verifica se produto existe e pertence à empresa
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        price: price !== undefined ? parseFloat(price) : undefined,
        category,
        active,
      },
    });

    res.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verifica se produto existe e pertence à empresa
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        companyId: req.user!.companyId,
      },
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    // Soft delete - apenas desativa
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    res.json({ message: 'Produto desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
};

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        companyId: req.user!.companyId,
        active: true,
      },
    });

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
};
