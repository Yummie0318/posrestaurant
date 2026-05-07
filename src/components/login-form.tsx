'use client';

import { Lock, User } from 'lucide-react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, Input, Label } from '@/components/ui';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const payload = (await response.json()) as { error?: string; redirectTo?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? 'Login failed');
      return;
    }

    router.push(searchParams.get('next') ?? payload.redirectTo ?? '/admin');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className="pl-10" placeholder="Enter your username" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10" placeholder="Enter your password" />
        </div>
      </div>
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <Button disabled={loading} className="w-full" size="lg">{loading ? 'Signing in...' : 'Sign in'}</Button>

      {/* Developer Credit */}
      <div className="border-t border-slate-100 pt-5 text-center">
        <p className="text-xs text-slate-400">Developed by</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-700">Arnold G. Mendoza</p>
        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-slate-400">
          <a
            href="https://www.facebook.com/arnold.mendoza.5283166/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-[#3340B3]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Facebook
          </a>
          <span className="text-slate-200">|</span>
          <a
            href="mailto:arnold10122017@gmail.com"
            className="flex items-center gap-1.5 transition-colors hover:text-[#3340B3]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            arnold10122017@gmail.com
          </a>
        </div>
      </div>
    </form>
  );
}