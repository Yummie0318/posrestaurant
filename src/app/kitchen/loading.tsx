import { Card, CardContent, Skeleton } from '@/components/ui';

export default function KitchenLoading() {
  return <div className="grid gap-4 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-6 w-32" /><div className="mt-4 space-y-3">{Array.from({ length: 3 }).map((__, j) => <Skeleton key={j} className="h-32 w-full rounded-2xl" />)}</div></CardContent></Card>)}</div>;
}
