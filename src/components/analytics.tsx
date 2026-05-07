'use client';

import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

type MonthlyPoint = { month: string; current: number; previous: number };
type BestSeller = { name: string; quantity: number; share: number };

export function SalesComparisonChart({ data, currency = 'PHP' }: { data: MonthlyPoint[]; currency?: string }) {
  const max = Math.max(...data.flatMap((item) => [item.current, item.previous]), 1);
  const currentTotal = data.reduce((sum, item) => sum + item.current, 0);
  const previousTotal = data.reduce((sum, item) => sum + item.previous, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Yearly Sales Comparison</CardTitle>
            <CardDescription>Monthly sales this year vs last year</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge className="gap-2" variant="outline"><span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />This year</Badge>
            <Badge className="gap-2" variant="outline"><span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" />Last year</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {/* Scrollable chart area */}
        <div className="overflow-x-auto pb-2 px-4 sm:px-0 touch-pan-x">
          <div className="flex items-end gap-2 sm:gap-3" style={{ minWidth: '600px' }}>
            {data.map((item) => (
              <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-52 w-full items-end justify-center gap-1 rounded-2xl bg-[var(--surface)] px-1 py-2 sm:h-56">
                  <div
                    title={`${item.month} current: ${formatCurrency(item.current, currency)}`}
                    className="w-1/2 rounded-t-md bg-[var(--primary)] transition-all"
                    style={{ height: `${Math.max((item.current / max) * 100, item.current > 0 ? 8 : 2)}%` }}
                  />
                  <div
                    title={`${item.month} previous: ${formatCurrency(item.previous, currency)}`}
                    className="w-1/2 rounded-t-md bg-[linear-gradient(180deg,#5B6CFF_0%,#8B5CF6_100%)] transition-all"
                    style={{ height: `${Math.max((item.previous / max) * 100, item.previous > 0 ? 8 : 2)}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-500">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Scroll hint on mobile */}
        <p className="mt-1 px-4 text-center text-[11px] text-slate-400 sm:hidden">← Scroll to see all months →</p>
        <div className="mt-5 grid gap-3 px-4 sm:grid-cols-3 sm:px-0">
          <Metric label="This year" value={formatCurrency(currentTotal, currency)} />
          <Metric label="Last year" value={formatCurrency(previousTotal, currency)} />
          <Metric label="YoY" value={`${previousTotal > 0 ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1) : '0.0'}%`} positive={currentTotal >= previousTotal} />
        </div>
      </CardContent>
    </Card>
  );
}

export function BestSellingMenuCard({ items }: { items: BestSeller[] }) {
  const total = items.reduce((sum, item) => sum + item.quantity, 0) || 1;
  const colors = ['#111439', '#3340B3', '#5B6CFF', '#7C3AED', '#94A3FF'];
  const gradient = items.length ? `conic-gradient(${items.map((item, index) => `${colors[index % colors.length]} 0 ${(items.slice(0, index + 1).reduce((s, i) => s + i.quantity, 0) / total) * 100}%`).join(', ')})` : '#e2e8f0';
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeItem = useMemo(() => (activeIndex === null ? null : items[activeIndex] ?? null), [activeIndex, items]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best-Selling Menu</CardTitle>
        <CardDescription>Top sold items for the current year to date</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Donut chart */}
        <div className="relative flex items-center justify-center">
          <div className="relative flex h-44 w-44 items-center justify-center rounded-full sm:h-48 sm:w-48" style={{ background: gradient }}>
            {items.map((item, index) => {
              const previousShare = items.slice(0, index).reduce((sum, entry) => sum + entry.quantity, 0) / total;
              const currentShare = item.quantity / total;
              return (
                <button
                  key={item.name}
                  type="button"
                  className="absolute inset-0 rounded-full"
                  style={{ clipPath: `polygon(50% 50%, ${polarPoint(previousShare * 360)}, ${polarPoint((previousShare + currentShare) * 360)}, 50% 50%)` }}
                  onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                  aria-label={`${item.name}: ${item.quantity} sold, ${item.share.toFixed(1)} percent share`}
                />
              );
            })}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-center shadow-inner sm:h-28 sm:w-28">
              <div>
                <div className="text-2xl font-bold text-[var(--foreground)]">{total}</div>
                <div className="text-[11px] text-slate-500">items sold</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 list — always visible */}
        {items.length ? (
          <div className="space-y-1.5">
            {items.map((item, index) => (
              <div
                key={item.name}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors cursor-pointer ${activeIndex === index ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="flex-1 truncate text-xs font-medium text-slate-700">{item.name}</span>
                <span className="text-xs text-slate-400">{item.share.toFixed(1)}%</span>
                <span className="text-xs font-semibold text-slate-700">{item.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-slate-400">No sales data yet</p>
        )}

        {/* Detail popup on click */}
        {activeItem ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[activeIndex ?? 0] }} />
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{activeItem.name}</p>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600"><span>Sold</span><span className="font-semibold text-[var(--foreground)]">{activeItem.quantity}</span></div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-600"><span>Share</span><span className="font-semibold text-[var(--foreground)]">{activeItem.share.toFixed(1)}%</span></div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function polarPoint(degrees: number) {
  const radians = (degrees - 90) * (Math.PI / 180);
  const x = 50 + Math.cos(radians) * 50;
  const y = 50 + Math.sin(radians) * 50;
  return `${x}% ${y}%`;
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-xl font-bold ${positive === undefined ? 'text-[var(--foreground)]' : positive ? 'text-[#1f8a70]' : 'text-[var(--danger)]'}`}>{value}</p></div>;
}