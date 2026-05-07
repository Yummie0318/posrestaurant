import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { getSessionUser } from '@/lib/auth';
import { createOrder } from '@/lib/order-service';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.CASHIER];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as unknown;
    const order = await createOrder(user.id, body);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
