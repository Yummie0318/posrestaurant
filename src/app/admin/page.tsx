import { PaymentStatus, UserRole } from '@prisma/client';
import { AppShell } from '@/components/app-shell';
import { BestSellingMenuCard, SalesComparisonChart } from '@/components/analytics';
import { StatCard } from '@/components/stat-card';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, EmptyState, TD, TH } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getAppSettings } from '@/lib/settings';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default async function AdminDashboardPage() {
  const user = await requireUser([UserRole.ADMIN]);
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfCurrentYear = new Date(currentYear, 0, 1);
  const startOfPreviousYear = new Date(previousYear, 0, 1);
  const startOfNextYear = new Date(currentYear + 1, 0, 1);

  const [ordersToday, recentOrders, yearlyOrders, yearToDateItems, settings] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: startOfDay } }, include: { items: true, payments: true } }),
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 18, include: { payments: true } }),
    db.order.findMany({ where: { createdAt: { gte: startOfPreviousYear, lt: startOfNextYear }, paymentStatus: PaymentStatus.PAID }, select: { createdAt: true, total: true } }),
    db.orderItem.findMany({ where: { order: { createdAt: { gte: startOfCurrentYear, lte: now }, paymentStatus: PaymentStatus.PAID } }, select: { productNameSnapshot: true, quantity: true } }),
    getAppSettings(),
  ]);

  const paidOrdersToday = ordersToday.filter((order) => order.paymentStatus === PaymentStatus.PAID);
  const totalRevenue = paidOrdersToday.reduce((sum, order) => sum + Number(order.total), 0);
  const averageTicket = paidOrdersToday.length ? totalRevenue / paidOrdersToday.length : 0;
  const unpaidCount = ordersToday.filter((order) => order.paymentStatus !== PaymentStatus.PAID).length;
  const completedCount = ordersToday.filter((order) => order.status === 'COMPLETED').length;

  const chartData = MONTHS.map((month, index) => ({
    month,
    current: yearlyOrders.filter((order) => order.createdAt.getFullYear() === currentYear && order.createdAt.getMonth() === index).reduce((sum, order) => sum + Number(order.total), 0),
    previous: yearlyOrders.filter((order) => order.createdAt.getFullYear() === previousYear && order.createdAt.getMonth() === index).reduce((sum, order) => sum + Number(order.total), 0),
  }));

  const groupedItems = Object.entries(yearToDateItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.productNameSnapshot] = (acc[item.productNameSnapshot] ?? 0) + item.quantity;
    return acc;
  }, {}))
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const topTotal = groupedItems.reduce((sum, item) => sum + item.quantity, 0) || 1;
  const bestSelling = groupedItems.map((item) => ({ ...item, share: (item.quantity / topTotal) * 100 }));

  return (
    <AppShell pathname="/admin" user={user} title="Admin Dashboard" subtitle="Modern POS overview for revenue, orders, and menu performance.">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid shrink-0 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Orders Today" value={ordersToday.length} helper="All orders created today" />
          <StatCard label="Revenue Today" value={totalRevenue} currency helper="Paid orders only" />
          <StatCard label="Average Ticket" value={averageTicket} currency helper="Per paid order" />
          <StatCard label="Completed" value={completedCount} helper="Ready and fulfilled today" />
          <StatCard label="Unpaid" value={unpaidCount} helper="Needs settlement" />
        </div>

        <div className="grid shrink-0 gap-4 xl:grid-cols-[1.5fr_1fr]">
          <SalesComparisonChart data={chartData} currency={settings.currency} />
          <BestSellingMenuCard items={bestSelling} />
        </div>

        <div className="grid min-h-[420px] shrink-0 gap-4 xl:grid-cols-[1.4fr_0.8fr] xl:min-h-[460px]">
          <Card className="flex min-h-0 flex-col overflow-hidden xl:h-[460px]">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest cashier and kitchen activity</CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              {recentOrders.length ? (
                <>
                  <div className="space-y-3 md:hidden">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                            <p className="text-sm text-slate-500">{order.orderType === 'DINE_IN' ? `Table ${order.tableNumber ?? '-'}` : order.customerName ?? '-'}</p>
                          </div>
                          <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'READY' ? 'warning' : 'secondary'}>{order.status}</Badge>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-500">Payment</span><Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'outline'}>{order.paymentStatus}</Badge></div>
                        <div className="mt-2 flex items-center justify-between text-sm"><span className="text-slate-500">Total</span><span className="font-semibold">{formatCurrency(Number(order.total), settings.currency)}</span></div>
                        <div className="mt-2 text-xs text-slate-500">{formatDateTime(order.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <DataTable>
                      <thead className="sticky top-0 bg-white">
                        <tr><TH>Order</TH><TH>Reference</TH><TH>Status</TH><TH>Payment</TH><TH>Total</TH><TH>Created</TH></tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-t border-slate-100">
                            <TD className="font-semibold">{order.orderNumber}</TD>
                            <TD>{order.orderType === 'DINE_IN' ? `Table ${order.tableNumber ?? '-'}` : order.customerName ?? '-'}</TD>
                            <TD><Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'READY' ? 'warning' : 'secondary'}>{order.status}</Badge></TD>
                            <TD><Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'outline'}>{order.paymentStatus}</Badge></TD>
                            <TD>{formatCurrency(Number(order.total), settings.currency)}</TD>
                            <TD className="text-slate-500">{formatDateTime(order.createdAt)}</TD>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  </div>
                </>
              ) : <EmptyState title="No recent orders" description="Orders will appear here once the store starts taking transactions." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Mix</CardTitle>
              <CardDescription>Quick operational breakdown for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">Dine-in</span><span className="text-lg font-semibold">{ordersToday.filter((order) => order.orderType === 'DINE_IN').length}</span></div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">Takeout</span><span className="text-lg font-semibold">{ordersToday.filter((order) => order.orderType === 'TAKEOUT').length}</span></div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">Paid Orders</span><span className="text-lg font-semibold">{paidOrdersToday.length}</span></div></div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-slate-700">This dashboard now uses actual POS data shaping: paid order totals for the year comparison and paid item quantities for year-to-date best sellers.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
