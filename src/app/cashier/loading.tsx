import { Card, CardContent, Skeleton } from '@/components/ui';

export default function CashierLoading() {
  return <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]"><Card><CardContent className="p-5"><Skeleton className="h-10 w-full" /><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}</div></CardContent></Card><Card><CardContent className="p-5"><Skeleton className="h-6 w-32" /><div className="mt-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div></CardContent></Card></div>;
}
