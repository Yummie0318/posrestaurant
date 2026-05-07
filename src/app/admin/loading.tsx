import { Card, CardContent, Skeleton } from '@/components/ui';

export default function AdminLoading() {
  return (
    <div className="space-y-4 p-1">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-8 w-32" /></CardContent></Card>)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-5 w-40" /><Skeleton className="mt-2 h-4 w-56" /><Skeleton className="mt-6 h-56 w-full" /></CardContent></Card>)}
      </div>
    </div>
  );
}
