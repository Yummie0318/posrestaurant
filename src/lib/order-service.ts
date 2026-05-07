import { OrderStatus, OrderType, PaymentStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAppSettings } from '@/lib/settings';
import { createOrderSchema, updateKitchenStatusSchema } from '@/lib/validators';

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateKitchenStatusInput = z.infer<typeof updateKitchenStatusSchema>;

const ALLOWED_KITCHEN_STATUSES: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED];

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function createOrderNumber(): string {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `ORD-${parts}-${suffix}`;
}

export async function createOrder(userId: string, rawInput: unknown) {
  const parsed = createOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid order input');
  }

  const settings = await getAppSettings();
  const { items, orderType, customerName, tableNumber, notes, paymentMethod, receivedAmount } = parsed.data;
  const productIds = items.map((item) => item.productId);
  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
      active: true,
      available: true,
    },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  if (products.length !== productIds.length) {
    throw new Error('One or more selected products are unavailable');
  }

  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const unitPrice = Number(product.price);
    const lineTotal = roundCurrency(unitPrice * item.quantity);

    return {
      productId: product.id,
      productNameSnapshot: product.name,
      priceSnapshot: unitPrice,
      quantity: item.quantity,
      notes: item.notes?.trim() ? item.notes.trim() : null,
      lineTotal,
    };
  });

  const subtotal = roundCurrency(lineItems.reduce((sum: number, item) => sum + item.lineTotal, 0));
  const taxRate = settings.taxRate > 0 ? settings.taxRate / 100 : 0;
  const tax = roundCurrency(subtotal * taxRate);
  const discount = 0;
  const total = roundCurrency(subtotal + tax - discount);
  const normalizedReceived = roundCurrency(receivedAmount);

  if (normalizedReceived < total) {
    throw new Error('Received amount must be greater than or equal to the order total');
  }

  const changeAmount = roundCurrency(normalizedReceived - total);
  const orderNumber = createOrderNumber();

  const order = await db.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        orderType,
        customerName: orderType === OrderType.TAKEOUT ? customerName?.trim() || null : null,
        tableNumber: orderType === OrderType.DINE_IN ? tableNumber?.trim() || null : null,
        notes: notes?.trim() || null,
        status: OrderStatus.PENDING,
        subtotal,
        tax,
        discount,
        total,
        paymentStatus: PaymentStatus.PAID,
        createdById: userId,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            priceSnapshot: item.priceSnapshot,
            quantity: item.quantity,
            notes: item.notes,
            lineTotal: item.lineTotal,
          })),
        },
        statusHistory: {
          create: {
            status: OrderStatus.PENDING,
            note: 'Order created by cashier',
            changedById: userId,
          },
        },
      },
      include: {
        items: true,
      },
    });

    await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        method: paymentMethod,
        amount: total,
        receivedAmount: normalizedReceived,
        changeAmount,
        paidById: userId,
      },
    });

    return createdOrder;
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    subtotal,
    tax,
    taxRate: settings.taxRate,
    total,
    changeAmount,
    paymentStatus: PaymentStatus.PAID,
    status: order.status,
    receiptUrl: `/orders/${order.id}/receipt`,
  };
}

export async function updateKitchenOrderStatus(user: { id: string; role: UserRole }, rawInput: unknown) {
  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.KITCHEN];
  if (!allowedRoles.includes(user.role)) {
    throw new Error('You do not have permission to update kitchen order status');
  }

  const parsed = updateKitchenStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid kitchen status input');
  }

  const { orderId, status } = parsed.data;
  if (!ALLOWED_KITCHEN_STATUSES.includes(status)) {
    throw new Error('Unsupported kitchen status');
  }

  const existingOrder = await db.order.findUnique({ where: { id: orderId } });
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  const completedAt = status === OrderStatus.COMPLETED ? new Date() : null;

  const updatedOrder = await db.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        completedAt,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status,
        changedById: user.id,
        note: `Status updated to ${status}`,
      },
    });

    return order;
  });

  return {
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    status: updatedOrder.status,
    completedAt: updatedOrder.completedAt,
  };
}
