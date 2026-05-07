import Link from 'next/link';
import { Eye, Filter, Search, X } from 'lucide-react';
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

  const hasFilters = !!(params.q || params.status || params.type);

  const where: Prisma.OrderWhereInput = {
    AND: [
      params.q ? { OR: [{ orderNumber: { contains: params.q, mode: 'insensitive' } }, { customerName: { contains: params.q, mode: 'insensitive' } }, { tableNumber: { contains: params.q, mode: 'insensitive' } }] } : {},
      params.status ? { status: params.status as never } : {},
      params.type ? { orderType: params.type as never } : {},
    ],
  };

  const orders = await db.order.findMany({
    include: { items: true, payments: true },
    where,
    orderBy: { createdAt: 'desc' },
    take: 80,
  });

  return (
    <AppShell pathname="/admin/orders" user={user} title="Orders" subtitle="Track transactions, payment state, and receipt access across the store.">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <Card className="flex min-h-0 flex-col overflow-hidden">

          {/* ── Header ── */}
          <CardHeader className="shrink-0 border-b border-slate-100 px-4 pb-0 pt-4 sm:px-5 lg:px-6">
            {/* Title row */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Order History</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  {hasFilters
                    ? <>{orders.length} result{orders.length === 1 ? '' : 's'} · <Link href="/admin/orders" className="text-[#5B6CFF] underline-offset-2 hover:underline">Clear filters</Link></>
                    : <>{orders.length} order{orders.length === 1 ? '' : 's'} loaded</>
                  }
                </CardDescription>
              </div>
            </div>

            {/* ── Filter bar ── */}
            <form className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Search — full width on mobile, grows on desktop */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  name="q"
                  defaultValue={params.q ?? ''}
                  placeholder="Order no., customer, table…"
                  className="h-9 w-full rounded-xl pl-8 text-sm"
                />
              </div>

              {/* Selects + buttons — always a single inline row */}
              <div className="flex items-center gap-2">
                <Select name="status" defaultValue={params.status ?? ''} className="h-9 flex-1 rounded-xl text-sm sm:w-[130px] sm:flex-none">
                  <option value="">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="COMPLETED">Completed</option>
                </Select>

                <Select name="type" defaultValue={params.type ?? ''} className="h-9 flex-1 rounded-xl text-sm sm:w-[120px] sm:flex-none">
                  <option value="">All types</option>
                  <option value="DINE_IN">Dine-in</option>
                  <option value="TAKEOUT">Takeout</option>
                </Select>

                <Button size="sm" className="h-9 shrink-0 rounded-xl px-3 text-sm">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Apply</span>
                </Button>

                {hasFilters && (
                  <Link href="/admin/orders" className="shrink-0">
                    <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl px-3 text-sm">
                      <X className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          </CardHeader>

          {/* ── Content ── */}
          <CardContent className="min-h-0 flex-1 overflow-auto p-0">
            {orders.length ? (
              <>
                {/* ── Mobile cards ── */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {orders.map((order) => {
                    const payment = order.payments[0] ?? null;
                    return (
                      <div key={order.id} className="flex items-center gap-3 px-4 py-3">
                        {/* Left: main info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-[12px] font-semibold text-slate-800" title={order.orderNumber}>
                            {order.orderNumber}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {order.orderType === 'DINE_IN' ? `Table ${order.tableNumber ?? '-'}` : order.customerName ?? '-'}
                            {' · '}
                            <span className="capitalize">{order.orderType.replace('_', ' ').toLowerCase()}</span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(order.createdAt)}</p>
                        </div>

                        {/* Center: status + payment */}
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <Badge
                            variant={order.status === 'COMPLETED' ? 'success' : order.status === 'READY' ? 'warning' : 'secondary'}
                            className="px-2 py-0.5 text-[10px]"
                          >
                            {order.status}
                          </Badge>
                          <p className="text-[11px] text-slate-500">{order.paymentStatus} · {payment?.method ?? 'N/A'}</p>
                        </div>

                        {/* Right: total + receipt */}
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(Number(order.total), settings.currency)}</p>
                          <Link href={`/orders/${order.id}/receipt`}>
                            <Button variant="outline" size="sm" className="h-7 rounded-lg px-2 text-[11px]">
                              <Eye className="h-3 w-3" />
                              Receipt
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Desktop table ── */}
                <div className="hidden md:block">
                  <DataTable>
                    <thead className="sticky top-0 bg-white">
                      <tr>
                        <TH className="w-[200px] pl-5 lg:pl-6">Order</TH>
                        <TH>Reference</TH>
                        <TH>Status</TH>
                        <TH>Payment</TH>
                        <TH>Total</TH>
                        <TH>Created</TH>
                        <TH className="w-14 pr-5 lg:pr-6">Receipt</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const payment = order.payments[0] ?? null;
                        return (
                          <tr key={order.id} className="border-t border-slate-100">
                            <TD className="w-[200px] max-w-[200px] pl-5 lg:pl-6">
                              <p className="truncate font-mono text-[13px] font-semibold text-slate-900" title={order.orderNumber}>
                                {order.orderNumber}
                              </p>
                              <p className="text-xs text-slate-500">{order.orderType}</p>
                            </TD>
                            <TD>{order.orderType === 'DINE_IN' ? `Table ${order.tableNumber ?? '-'}` : order.customerName ?? '-'}</TD>
                            <TD>
                              <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'READY' ? 'warning' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </TD>
                            <TD>
                              <p>{order.paymentStatus}</p>
                              <p className="text-xs text-slate-500">{payment?.method ?? 'N/A'}</p>
                            </TD>
                            <TD>
                              <p className="font-semibold">{formatCurrency(Number(order.total), settings.currency)}</p>
                              <p className="text-xs text-slate-500">Tax {formatCurrency(Number(order.tax), settings.currency)}</p>
                            </TD>
                            <TD className="text-slate-500">{formatDateTime(order.createdAt)}</TD>
                            <TD className="pr-5 lg:pr-6">
                              <Link href={`/orders/${order.id}/receipt`}>
                                <Button variant="outline" size="icon" aria-label="View receipt">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TD>
                          </tr>
                        );
                      })}
                    </tbody>
                  </DataTable>
                </div>
              </>
            ) : (
              <div className="p-6">
                <EmptyState title="No matching orders" description="Try widening the search or removing one of the filters." />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}