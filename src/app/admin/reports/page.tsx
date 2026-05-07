import { PaymentStatus, UserRole } from '@prisma/client';
import { AppShell } from '@/components/app-shell';
import { StatCard } from '@/components/stat-card';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, TD, TH } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getAppSettings } from '@/lib/settings';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default async function ReportsPage() {
  const user = await requireUser([UserRole.ADMIN]);
  const [orders, settings] = await Promise.all([db.order.findMany({ include: { items: true, payments: true }, orderBy: { createdAt: 'desc' }, take: 50 }), getAppSettings()]);
  const totalRevenue = orders.filter((order) => order.paymentStatus === PaymentStatus.PAID).reduce((sum, order) => sum + Number(order.total), 0);
  const bestSelling = await db.orderItem.groupBy({ by: ['productNameSnapshot'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 10 });
  const dineInCount = orders.filter((order) => order.orderType === 'DINE_IN').length;
  const takeoutCount = orders.filter((order) => order.orderType === 'TAKEOUT').length;
  const paidCount = orders.filter((order) => order.paymentStatus === PaymentStatus.PAID).length;
  const unpaidCount = orders.length - paidCount;
  const averageTicket = paidCount > 0 ? totalRevenue / paidCount : 0;

  return <AppShell pathname="/admin/reports" user={user} title="Reports" subtitle="Readable performance reporting for revenue, order mix, and menu demand.">
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="grid shrink-0 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard label="Revenue" value={totalRevenue} currency />
        <StatCard label="Average Ticket" value={averageTicket} currency />
        <StatCard label="Paid Orders" value={paidCount} />
        <StatCard label="Unpaid Orders" value={unpaidCount} />
      </div>
      <div className="grid min-h-0 gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="flex min-h-0 flex-col overflow-hidden"><CardHeader><CardTitle>Orders by Date</CardTitle><CardDescription>Latest 50 transactions</CardDescription></CardHeader><CardContent className="min-h-0 flex-1 overflow-auto"><div className="space-y-3 md:hidden">{orders.map((order) => <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{order.orderNumber}</p><p className="text-sm text-slate-500">{formatDateTime(order.createdAt)}</p></div><Badge variant={order.status === 'COMPLETED' ? 'success' : 'secondary'}>{order.status}</Badge></div><div className="mt-3 grid gap-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Type</span><span>{order.orderType}</span></div><div className="flex justify-between"><span className="text-slate-500">Payment</span><span>{order.paymentStatus}</span></div><div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold">{formatCurrency(Number(order.total), settings.currency)}</span></div></div></div>)}</div><div className="hidden md:block"><DataTable><thead className="sticky top-0 bg-white"><tr><TH>Date</TH><TH>Order</TH><TH>Type</TH><TH>Status</TH><TH>Payment</TH><TH>Total</TH></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-slate-100"><TD className="text-slate-500">{formatDateTime(order.createdAt)}</TD><TD className="font-semibold text-slate-900">{order.orderNumber}</TD><TD>{order.orderType}</TD><TD><Badge variant={order.status === 'COMPLETED' ? 'success' : 'secondary'}>{order.status}</Badge></TD><TD>{order.paymentStatus}</TD><TD>{formatCurrency(Number(order.total), settings.currency)}</TD></tr>)}</tbody></DataTable></div></CardContent></Card>
        <div className="flex min-h-0 flex-col gap-4"><Card className="flex min-h-0 flex-col overflow-hidden"><CardHeader><CardTitle>Best-selling Items</CardTitle><CardDescription>Top movers from recorded order items</CardDescription></CardHeader><CardContent className="min-h-0 flex-1 overflow-auto space-y-3">{bestSelling.map((item) => <div key={item.productNameSnapshot} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-900">{item.productNameSnapshot}</p><Badge variant="outline">{item._sum.quantity ?? 0} sold</Badge></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Order Mix Summary</CardTitle><CardDescription>Fast operational breakdown</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="text-sm text-slate-500">Dine-in</span><span className="text-lg font-semibold">{dineInCount}</span></div><div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="text-sm text-slate-500">Takeout</span><span className="text-lg font-semibold">{takeoutCount}</span></div><div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><span className="text-sm text-slate-500">Collection Rate</span><span className="text-lg font-semibold">{orders.length > 0 ? `${Math.round((paidCount / orders.length) * 100)}%` : '0%'}</span></div></CardContent></Card></div>
      </div>
    </div>
  </AppShell>;
}
