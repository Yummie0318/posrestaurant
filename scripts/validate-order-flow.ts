import 'dotenv/config';
import { UserRole } from '@prisma/client';
import { db } from '../src/lib/db';
import { createOrder, updateKitchenOrderStatus } from '../src/lib/order-service';

async function main() {
  const cashier = await db.user.findUnique({ where: { username: 'cashier' } });
  const kitchen = await db.user.findUnique({ where: { username: 'kitchen' } });
  const products = await db.product.findMany({
    where: { slug: { in: ['pancit-canton-solo', 'iced-tea'] } },
    orderBy: { name: 'asc' },
  });

  if (!cashier || !kitchen) {
    throw new Error('Seed users not found');
  }

  if (products.length < 2) {
    throw new Error('Required seed products not found');
  }

  const created = await createOrder(cashier.id, {
    orderType: 'TAKEOUT',
    customerName: 'Flow Test Customer',
    tableNumber: '',
    notes: 'Validation flow test',
    paymentMethod: 'cash',
    receivedAmount: 500,
    items: [
      { productId: products[0].id, quantity: 1, notes: 'no onion' },
      { productId: products[1].id, quantity: 2, notes: '' },
    ],
  });

  const preparing = await updateKitchenOrderStatus({ id: kitchen.id, role: UserRole.KITCHEN }, { orderId: created.orderId, status: 'PREPARING' });
  const ready = await updateKitchenOrderStatus({ id: kitchen.id, role: UserRole.KITCHEN }, { orderId: created.orderId, status: 'READY' });
  const completed = await updateKitchenOrderStatus({ id: kitchen.id, role: UserRole.KITCHEN }, { orderId: created.orderId, status: 'COMPLETED' });

  const finalOrder = await db.order.findUniqueOrThrow({
    where: { id: created.orderId },
    include: {
      items: true,
      payments: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  console.log(
    JSON.stringify(
      {
        created,
        preparing,
        ready,
        completed,
        final: {
          orderNumber: finalOrder.orderNumber,
          status: finalOrder.status,
          paymentStatus: finalOrder.paymentStatus,
          total: Number(finalOrder.total),
          itemCount: finalOrder.items.length,
          paymentCount: finalOrder.payments.length,
          statusHistory: finalOrder.statusHistory.map((entry) => entry.status),
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
