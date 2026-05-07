import { Card, CardContent, Skeleton } from '@/components/ui';

export default function LoginLoading() {
  return <main className="flex min-h-screen items-center justify-center px-4 py-8"><div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[1.1fr_0.9fr]"><Card><CardContent className="p-10"><Skeleton className="h-8 w-32" /><Skeleton className="mt-6 h-12 w-full max-w-xl" /><Skeleton className="mt-3 h-24 w-full max-w-2xl" /></CardContent></Card><Card><CardContent className="p-10"><Skeleton className="h-8 w-28" /><Skeleton className="mt-6 h-10 w-full" /><Skeleton className="mt-4 h-10 w-full" /><Skeleton className="mt-4 h-11 w-full" /></CardContent></Card></div></main>;
}
