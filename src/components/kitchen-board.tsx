'use client';

import { AlertCircle, ChefHat, Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus, OrderType } from '@prisma/client';
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui';
import { cn, formatDateTime } from '@/lib/utils';

export type KitchenOrder = {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  customerName: string | null;
  tableNumber: string | null;
  notes: string | null;
  status: OrderStatus;
  createdAt: string;
  items: { id: string; productNameSnapshot: string; quantity: number; notes: string | null }[];
};

const columns = [
  { key: OrderStatus.PENDING, label: 'Pending' },
  { key: OrderStatus.PREPARING, label: 'Preparing' },
  { key: OrderStatus.READY, label: 'Ready' },
] as const;

export function KitchenBoard({ orders }: { orders: KitchenOrder[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.PENDING);

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 15000);
    return () => window.clearInterval(interval);
  }, [router]);

  const counts = useMemo(() => ({
    [OrderStatus.PENDING]: orders.filter((o) => o.status === OrderStatus.PENDING).length,
    [OrderStatus.PREPARING]: orders.filter((o) => o.status === OrderStatus.PREPARING).length,
    [OrderStatus.READY]: orders.filter((o) => o.status === OrderStatus.READY).length,
  }), [orders]);

  async function updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    setUpdatingId(orderId);
    setError(null);
    const response = await fetch('/api/orders/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, status }) });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? 'Failed to update kitchen status.');
      setUpdatingId(null);
      return;
    }
    setUpdatingId(null);
    router.refresh();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 xl:hidden">
        {columns.map((column) => (
          <button key={column.key} type="button" onClick={() => setActiveTab(column.key)} className={cn('inline-flex items-center gap-2 whitespace-nowrap rounded-2xl border px-3 py-2 text-sm font-medium transition', activeTab === column.key ? 'border-transparent bg-[var(--primary)] text-white' : 'border-[var(--border)] bg-white text-[var(--foreground)]')}>
            <span>{column.label}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs', activeTab === column.key ? 'bg-white/14 text-white' : 'bg-[var(--surface)] text-[var(--foreground)]')}>{counts[column.key]}</span>
          </button>
        ))}
      </div>
      <div className="grid h-full min-h-0 gap-3 xl:grid-cols-3">
        {columns.map((column) => {
          const columnOrders = orders.filter((order) => order.status === column.key);
          const hiddenOnSmall = activeTab !== column.key;
          return (
            <Card key={column.key} className={cn('min-h-0 flex-col overflow-hidden', hiddenOnSmall ? 'hidden xl:flex' : 'flex')}>
              <CardHeader className="shrink-0 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">{column.label}</CardTitle>
                    <p className="mt-1 text-xs text-slate-500">{columnOrders.length} active ticket{columnOrders.length === 1 ? '' : 's'}</p>
                  </div>
                  <Badge variant={column.key === OrderStatus.READY ? 'warning' : 'outline'}>{columnOrders.length}</Badge>
                </div>
                {error ? <Alert variant="destructive" className="mt-3">{error}</Alert> : null}
              </CardHeader>
              <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto pt-0">
                {columnOrders.length === 0 ? <EmptyState title={`No ${column.label.toLowerCase()} orders`} description="New tickets will appear here automatically." /> : null}
                {columnOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2"><ChefHat className="h-4 w-4 text-slate-400" /><p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p></div>
                        <p className="mt-1 text-xs text-slate-500">{order.orderType === OrderType.DINE_IN ? `Dine-in • ${order.tableNumber ?? '-'}` : `Takeout • ${order.customerName ?? '-'}`}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3 w-3" />{formatDateTime(order.createdAt)}</div>
                    </div>
                    {order.notes ? <Alert className="mt-2 border-[var(--border)] bg-[var(--surface)] py-2 text-[var(--foreground)]"><div className="flex items-center gap-2 text-xs"><AlertCircle className="h-3.5 w-3.5 text-[#5B6CFF]" />{order.notes}</div></Alert> : null}
                    <div className="mt-2 space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="rounded-lg bg-white px-3 py-2 shadow-sm">
                          <p className="text-sm font-semibold text-slate-900">{item.quantity}× {item.productNameSnapshot}</p>
                          {item.notes ? <p className="mt-1 text-xs text-[var(--danger)]">{item.notes}</p> : null}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2">
                      {column.key === OrderStatus.PENDING ? <Button disabled={updatingId === order.id} className="h-9 w-full bg-[var(--primary)] text-xs hover:bg-[var(--primary-strong)]" onClick={() => updateStatus(order.id, OrderStatus.PREPARING)}>{updatingId === order.id ? 'Updating...' : 'Start Preparing'}</Button> : null}
                      {column.key === OrderStatus.PREPARING ? <Button disabled={updatingId === order.id} className="h-9 w-full bg-[linear-gradient(135deg,#3340B3_0%,#7C3AED_100%)] text-xs hover:opacity-95" onClick={() => updateStatus(order.id, OrderStatus.READY)}>{updatingId === order.id ? 'Updating...' : 'Mark Ready'}</Button> : null}
                      {column.key === OrderStatus.READY ? <Button disabled={updatingId === order.id} className="h-9 w-full text-xs" onClick={() => updateStatus(order.id, OrderStatus.COMPLETED)}>{updatingId === order.id ? 'Updating...' : 'Complete Order'}</Button> : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
