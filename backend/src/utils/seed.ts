import prisma from '../config/database';
import { hashPassword } from './password';
import { env } from '../config/env';
import { addDays } from 'date-fns';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo company
    const company = await prisma.company.create({
      data: {
        name: 'Espetaria Demo',
        email: 'demo@espetariapro.com',
        phone: '(11) 99999-9999',
        address: 'Rua Demo, 123 - São Paulo/SP',
      },
    });

    console.log('✅ Company created:', company.name);

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Administrador',
        email: 'admin@espetariapro.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created:', admin.email);

    // Create waiter user
    const waiterPassword = await hashPassword('waiter123');
    const waiter = await prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Garçom Demo',
        email: 'waiter@espetariapro.com',
        password: waiterPassword,
        role: 'WAITER',
      },
    });

    console.log('✅ Waiter user created:', waiter.email);

    // Create subscription (trial)
    const subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        plan: 'FREE',
        status: 'TRIAL',
        startDate: new Date(),
        endDate: addDays(new Date(), env.FREE_TRIAL_DAYS),
      },
    });

    console.log('✅ Subscription created:', subscription.plan, '- Trial ends:', subscription.endDate);

    // Create sample products
    const products = [
      { name: 'Espeto de Carne', price: 8.00, category: 'Espetos' },
      { name: 'Espeto de Frango', price: 7.00, category: 'Espetos' },
      { name: 'Espeto de Linguiça', price: 6.50, category: 'Espetos' },
      { name: 'Espeto de Coração', price: 7.50, category: 'Espetos' },
      { name: 'Espeto de Kafta', price: 8.50, category: 'Espetos' },
      { name: 'Pão de Alho', price: 5.00, category: 'Acompanhamentos' },
      { name: 'Batata Frita', price: 12.00, category: 'Acompanhamentos' },
      { name: 'Arroz', price: 8.00, category: 'Acompanhamentos' },
      { name: 'Feijão Tropeiro', price: 10.00, category: 'Acompanhamentos' },
      { name: 'Coca-Cola 350ml', price: 6.00, category: 'Bebidas' },
      { name: 'Guaraná 350ml', price: 5.50, category: 'Bebidas' },
      { name: 'Água 500ml', price: 3.00, category: 'Bebidas' },
      { name: 'Cerveja 600ml', price: 12.00, category: 'Bebidas' },
    ];

    for (const product of products) {
      await prisma.product.create({
        data: {
          companyId: company.id,
          name: product.name,
          price: product.price,
          category: product.category,
          active: true,
        },
      });
    }

    console.log('✅ Products created:', products.length);

    // Create sample tables
    const tables = [
      { name: 'Mesa 01' },
      { name: 'Mesa 02' },
      { name: 'Mesa 03' },
      { name: 'Mesa 04' },
      { name: 'Mesa 05' },
      { name: 'Mesa 06' },
      { name: 'Mesa 07' },
      { name: 'Mesa 08' },
      { name: 'Mesa 09' },
      { name: 'Mesa 10' },
    ];

    for (const table of tables) {
      await prisma.table.create({
        data: {
          companyId: company.id,
          name: table.name,
          status: 'CLOSED',
          totalAmount: 0,
        },
      });
    }

    console.log('✅ Tables created:', tables.length);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Admin: admin@espetariapro.com / admin123');
    console.log('   Waiter: waiter@espetariapro.com / waiter123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
