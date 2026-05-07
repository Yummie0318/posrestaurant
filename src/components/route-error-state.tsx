'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, Button, Card, CardContent } from '@/components/ui';

export function RouteErrorState({ title = 'Something went wrong', message = 'An unexpected error happened while loading this page.', onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl rounded-3xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--primary)]"><AlertTriangle className="h-6 w-6" /></div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">{title}</h1>
          <Alert variant="destructive" className="mt-4 text-left">{message}</Alert>
          <div className="mt-6 flex justify-center"><Button onClick={onRetry}>Try again</Button></div>
        </CardContent>
      </Card>
    </main>
  );
}
