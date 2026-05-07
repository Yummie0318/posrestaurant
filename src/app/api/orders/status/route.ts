import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateKitchenOrderStatus } from '@/lib/order-service';

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const order = await updateKitchenOrderStatus(user, body);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update order status';
    const status = message === 'Order not found' ? 404 : message.includes('permission') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
