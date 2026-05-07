import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { Badge, Card, CardContent } from '@/components/ui';
import { getDefaultRouteForRole, getSessionUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(getDefaultRouteForRole(user.role));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-8">
      <div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden rounded-[2rem] border-0 bg-[linear-gradient(135deg,#111439_0%,#3340B3_48%,#7C3AED_100%)] text-white shadow-[0_20px_50px_rgba(17,20,57,0.12)]">
          <CardContent className="flex h-full flex-col justify-between p-8 sm:p-10 lg:p-12">
            <div>
              <Badge className="border-white/20 bg-white/10 text-white">PosPancitan</Badge>
              <h1 className="mt-6 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">A cleaner POS workspace for cashier speed, kitchen flow, and admin control.</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">Built for small restaurants and food businesses — manage orders, track your kitchen queue, and stay on top of daily operations all in one place.</p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Info title="Fast cashier flow" body="Searchable catalog, mobile-first order handling, and focused checkout." />
              <Info title="Kitchen board" body="Readable queue states with clearer actions and better empty/error handling." />
              <Info title="Admin control" body="Consistent tables, cards, dialogs, and analytics across pages." />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] shadow-none">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#5B6CFF]">Welcome back</p>
              <h2 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Sign in</h2>
              <p className="mt-2 text-sm text-slate-500">Role-based access for admin, cashier, and kitchen users.</p>
            </div>
            <LoginForm />
          </CardContent>
        </Card>
      </div>

    </main>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><p className="font-semibold">{title}</p><p className="mt-2 text-sm text-white/80">{body}</p></div>;
}