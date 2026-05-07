import Link from 'next/link';
import { Eye, Filter } from 'lucide-react';
import { Prisma, UserRole } from '@prisma/client';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, EmptyState, Input, Select, TD, TH } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getAppSettings } from '@/lib/settings';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string }> }) {
  const user = await requireUser([UserRole.ADMIN]);
  const params = await searchParams;
  const settings = await getAppSettings();
  const where: Prisma.OrderWhereInput = { AND: [params.q ? { OR: [{ orderNumber: { contains: params.q, mode: 'insensitive' } }, { customerName: { contains: params.q, mode: 'insensitive' } }, { tableNumber: { contains: params.q, mode: 'insensitive' } }] } : {}, params.status ? { status: params.status as never } : {}, params.type ? { orderType: params.type as never } : {}] };
  const orders = await db.order.findMany({ include: { items: true, payments: true }, where, orderBy: { createdAt: 'desc' }, take: 80 });

  return (
    <AppShell pathname="/admin/orders" user={user} title="Orders" subtitle="Track transactions, payment state, and receipt access across the store.">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Card className="shrink-0">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search by order number, customer, or table, then narrow by status and type.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr_auto]">
              <Input name="q" defaultValue={params.q ?? ''} placeholder="Search order no., customer, or table" />
              <Select name="status" defaultValue={params.status ?? ''}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="PREPARING">Preparing</option><option value="READY">Ready</option><option value="COMPLETED">Completed</option></Select>
              <Select name="type" defaultValue={params.type ?? ''}><option value="">All types</option><option value="DINE_IN">Dine-in</option><option value="TAKEOUT">Takeout</option></Select>
              <div className="flex gap-2"><Button><Filter className="h-4 w-4" />Apply</Button><Link href="/admin/orders"><Button type="button" variant="outline">Reset</Button></Link></div>
            </form>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>{orders.length} order{orders.length === 1 ? '' : 's'} loaded</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto">
            {orders.length ? (
              <>
                <div className="space-y-3 md:hidden">
                  {orders.map((order) => {
                    const payment = order.payments[0] ?? null;
                    return <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{order.orderNumber}</p><p className="text-sm text-slate-500">{order.orderType === 'DINE_IN' ? `Table ${order.tableNumber ?? '-'}` : order.customerName ?? '-'}</p></div><Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'READY' ? 'warning' : 'secondary'}>{order.status}</Badge></div><div className="mt-3 grid gap-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Payment</span><span>{order.paymentStatus} · {payment?.method ?? 'N/A'}</span></div><div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold">{formatCurrency(Number(order.total), settings.currency)}</span></div><div className="flex justify-between"><span className="text-slate-500">Created</span><span>{formatDateTime(order.createdAt)}</span></div></div><div className="mt-4"><Link href={`/orders/${order.id}/receipt`}><Button variant="outline" size="sm"><Eye className="h-4 w-4" />Receipt</Button></Link></div></div>;
                  })}
                </div>
                <div className="hidden md:block"><DataTable><thead className="sticky top-0 bg-white"><tr><TH>Order</TH><TH>Reference</TH><TH>Status</TH><TH>Payment</TH><TH>Total</TH><TH>Created</TH><TH>Receipt</TH></tr></thead><tbody>{orders.map((order) => { const payment = order.payments[0] ?? null; return <tr key={order.id} className="border-t border-slate-100"><TD><p className="font-semibold text-slate-900">{order.orderNumber}</p><p className="text-xs text-slate-500">{order.orderType}</p></TD><TD>{order.orderType === 'DINE_IN' ? `Table ${order.tableNumber ?? '-'}` : order.customerName ?? '-'}</TD><TD><Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'READY' ? 'warning' : 'secondary'}>{order.status}</Badge></TD><TD><p>{order.paymentStatus}</p><p className="text-xs text-slate-500">{payment?.method ?? 'N/A'}</p></TD><TD><p className="font-semibold">{formatCurrency(Number(order.total), settings.currency)}</p><p className="text-xs text-slate-500">Tax {formatCurrency(Number(order.tax), settings.currency)}</p></TD><TD className="text-slate-500">{formatDateTime(order.createdAt)}</TD><TD><Link href={`/orders/${order.id}/receipt`}><Button variant="outline" size="icon" aria-label="View receipt"><Eye className="h-4 w-4" /></Button></Link></TD></tr>; })}</tbody></DataTable></div>
              </>
            ) : <EmptyState title="No matching orders" description="Try widening the search or removing one of the filters." />}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
