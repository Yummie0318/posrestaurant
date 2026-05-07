import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

export function StatCard({ label, value, currency, helper }: { label: string; value: number; currency?: boolean; helper?: string }) {
  return (
    <Card className="rounded-2xl border-transparent bg-[linear-gradient(180deg,rgba(91,108,255,0.08)_0%,rgba(255,255,255,1)_65%)] shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{currency ? formatCurrency(value) : value}</p>
            {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
          </div>
          <div className="rounded-2xl bg-[var(--surface)] p-2.5 text-[#4F5DE5]"><TrendingUp className="h-4 w-4" /></div>
        </div>
      </CardContent>
    </Card>
  );
}
