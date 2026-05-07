import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, Card, CardContent, Separator } from '@/components/ui';
import { ReceiptPrintButton } from '@/components/receipt-print-button';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getAppSettings } from '@/lib/settings';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const [order, settings] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true, payments: true } }),
    getAppSettings(),
  ]);
  if (!order) notFound();
  const payment = order.payments[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white">
      <Card className="mx-auto max-w-[360px] rounded-3xl print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <CardContent className="p-6 print:p-0">
          <div className="mb-6 flex items-center justify-between print:hidden">
            <Link href="/admin/orders"><Button variant="outline">Back to Orders</Button></Link>
            <ReceiptPrintButton />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-wide text-slate-900">{settings.storeName}</h1>
            <p className="mt-1 text-xs text-slate-500">{settings.businessAddress}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-700">Official Receipt</p>
          </div>
          <Separator className="my-4 border-dashed" />
          <div className="grid gap-1 text-[11px]">
            <Line label="Order No." value={order.orderNumber} />
            <Line label="Date" value={formatDateTime(order.createdAt)} />
            <Line label="Type" value={order.orderType} />
            <Line label="Reference" value={order.orderType === 'DINE_IN' ? `Table ${order.tableNumber ?? '-'}` : order.customerName ?? '-'} />
            <Line label="Status" value={order.status} />
          </div>
          <Separator className="my-4 border-dashed" />
          <div className="space-y-3 text-[11px]">
            {order.items.map((item) => <div key={item.id} className="border-b border-dashed border-slate-200 pb-3"><div className="flex justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.quantity}× {item.productNameSnapshot}</p><p className="text-slate-500">{formatCurrency(Number(item.priceSnapshot), settings.currency)} each</p>{item.notes ? <p className="mt-1 text-[var(--danger)]">{item.notes}</p> : null}</div><p className="font-semibold text-slate-900">{formatCurrency(Number(item.lineTotal), settings.currency)}</p></div></div>)}
          </div>
          <Separator className="my-4 border-dashed" />
          <div className="space-y-1 text-[11px]">
            <Line label="Subtotal" value={formatCurrency(Number(order.subtotal), settings.currency)} />
            <Line label="Tax" value={formatCurrency(Number(order.tax), settings.currency)} />
            <Line label="Discount" value={formatCurrency(Number(order.discount), settings.currency)} />
            <div className="flex justify-between text-sm font-bold"><span>Total</span><span>{formatCurrency(Number(order.total), settings.currency)}</span></div>
            <div className="pt-2">
              <Line label="Payment Method" value={payment?.method ?? 'N/A'} />
              <Line label="Received" value={payment ? formatCurrency(Number(payment.receivedAmount ?? 0), settings.currency) : 'N/A'} />
              <Line label="Change" value={payment ? formatCurrency(Number(payment.changeAmount ?? 0), settings.currency) : 'N/A'} />
            </div>
          </div>
          <Separator className="my-4 border-dashed" />
          <p className="text-center text-[11px] text-slate-500">{settings.receiptFooter}</p>
        </CardContent>
      </Card>
    </main>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><span>{label}</span><span className="text-right">{value}</span></div>;
}
