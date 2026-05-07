import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <Card className="max-w-md rounded-3xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--primary)]"><AlertCircle className="h-6 w-6" /></div>
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Unauthorized</h1>
          <p className="mt-3 text-slate-500">You do not have permission to access this area.</p>
          <Link href="/login" className="mt-6 inline-flex"><Button>Back to Login</Button></Link>
        </CardContent>
      </Card>
    </main>
  );
}
