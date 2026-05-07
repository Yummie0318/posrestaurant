import 'dotenv/config';
import { PrismaClient, Prisma, UserRole, OrderStatus, PaymentStatus, OrderType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.createMany({
    data: [
      { name: 'Admin User', username: 'admin', passwordHash, role: UserRole.ADMIN },
      { name: 'Cashier User', username: 'cashier', passwordHash, role: UserRole.CASHIER },
      { name: 'Kitchen User', username: 'kitchen', passwordHash, role: UserRole.KITCHEN },
    ],
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Pancit', slug: 'pancit', sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Bilao', slug: 'bilao', sortOrder: 2 } }),
    prisma.category.create({ data: { name: 'Add-ons', slug: 'add-ons', sortOrder: 3 } }),
    prisma.category.create({ data: { name: 'Drinks', slug: 'drinks', sortOrder: 4 } }),
    prisma.category.create({ data: { name: 'Rice Meals', slug: 'rice-meals', sortOrder: 5 } }),
  ]);

  const categoryMap = Object.fromEntries(categories.map((category) => [category.slug, category.id]));

  const products: Prisma.ProductCreateManyInput[] = [
    { categoryId: categoryMap['pancit'], name: 'Pancit Canton Solo', slug: 'pancit-canton-solo', description: 'Good for 1-2 pax', price: 95, imageUrl: '/products/pancit-canton-solo.jpg' },
    { categoryId: categoryMap['pancit'], name: 'Pancit Bihon Solo', slug: 'pancit-bihon-solo', description: 'Classic bihon serving', price: 90 },
    { categoryId: categoryMap['pancit'], name: 'Pancit Bam-i Solo', slug: 'pancit-bam-i-solo', description: 'Bam-i with mixed noodles', price: 110 },
    { categoryId: categoryMap['bilao'], name: 'Bilao Small', slug: 'bilao-small', description: 'Good for 5-7 pax', price: 450 },
    { categoryId: categoryMap['bilao'], name: 'Bilao Medium', slug: 'bilao-medium', description: 'Good for 8-10 pax', price: 650 },
    { categoryId: categoryMap['bilao'], name: 'Bilao Large', slug: 'bilao-large', description: 'Good for 12-15 pax', price: 850 },
    { categoryId: categoryMap['add-ons'], name: 'Extra Egg', slug: 'extra-egg', description: 'Fresh egg topping', price: 20 },
    { categoryId: categoryMap['add-ons'], name: 'Extra Chicken', slug: 'extra-chicken', description: 'Additional chicken topping', price: 45 },
    { categoryId: categoryMap['drinks'], name: 'Iced Tea', slug: 'iced-tea', description: 'House blend iced tea', price: 35, imageUrl: '/products/iced-tea.svg' },
    { categoryId: categoryMap['drinks'], name: 'Softdrinks', slug: 'softdrinks', description: 'Regular can', price: 40 },
    { categoryId: categoryMap['rice-meals'], name: 'Pork Silog', slug: 'pork-silog', description: 'Rice meal with egg', price: 120 },
    { categoryId: categoryMap['rice-meals'], name: 'Chicken Teriyaki Meal', slug: 'chicken-teriyaki-meal', description: 'Sweet glazed chicken', price: 135 },
  ];

  await prisma.product.createMany({ data: products });

  const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'admin' } });
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-0001',
      orderType: OrderType.DINE_IN,
      tableNumber: 'T1',
      notes: 'Starter sample order',
      status: OrderStatus.PREPARING,
      subtotal: 185,
      tax: 0,
      discount: 0,
      total: 185,
      paymentStatus: PaymentStatus.UNPAID,
      createdById: admin.id,
      items: {
        create: [
          { productNameSnapshot: 'Pancit Canton Solo', priceSnapshot: 95, quantity: 1, lineTotal: 95, notes: 'extra egg' },
          { productNameSnapshot: 'Iced Tea', priceSnapshot: 35, quantity: 2, lineTotal: 70 },
          { productNameSnapshot: 'Extra Egg', priceSnapshot: 20, quantity: 1, lineTotal: 20 },
        ],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, changedById: admin.id, note: 'Order created' },
          { status: OrderStatus.PREPARING, changedById: admin.id, note: 'Sent to kitchen' },
        ],
      },
    },
  });

  await prisma.setting.createMany({
    data: [
      { key: 'store_name', value: 'PosPancitan Demo Store' },
      { key: 'tax_rate', value: '0' },
      { key: 'currency', value: 'PHP' },
      { key: 'receipt_footer', value: 'Thank you for dining with us!' },
      { key: 'business_address', value: 'Panciteria Main Branch' },
    ],
  });

  console.log(`Seed complete. Sample order: ${sampleOrder.orderNumber}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
