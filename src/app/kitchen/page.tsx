import { OrderStatus, UserRole } from '@prisma/client';
import { AppShell } from '@/components/app-shell';
import { Badge, Card, CardContent } from '@/components/ui';
import { KitchenBoard, type KitchenOrder } from '@/components/kitchen-board';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function KitchenPage() {
  const user = await requireUser([UserRole.ADMIN, UserRole.KITCHEN]);
  const orders = await db.order.findMany({
    where: { status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY] } },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  });

  const kitchenOrders: KitchenOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    customerName: order.customerName,
    tableNumber: order.tableNumber,
    notes: order.notes,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({ id: item.id, productNameSnapshot: item.productNameSnapshot, quantity: item.quantity, notes: item.notes })),
  }));

  return (
    <AppShell pathname="/kitchen" user={user} title="Kitchen Board" subtitle="Real-time preparation queue with clearer ticket priority and actions." hideSidebar={user.role === UserRole.KITCHEN} headerLogout={user.role === UserRole.KITCHEN}>
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        {/* <Card className="shrink-0">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
            <p className="text-sm text-slate-500">Auto-refresh runs every 15 seconds to keep tickets current.</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{kitchenOrders.filter((o) => o.status === 'PENDING').length} pending</Badge>
              <Badge variant="warning">{kitchenOrders.filter((o) => o.status === 'READY').length} ready</Badge>
            </div>
          </CardContent>
        </Card> */}
        <div className="min-h-0 flex-1 overflow-hidden"><KitchenBoard orders={kitchenOrders} /></div>
      </div>
    </AppShell>
  );
}
