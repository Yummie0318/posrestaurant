import { NextResponse } from 'next/server';
import { authenticateUser, createSessionCookie, getDefaultRouteForRole } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid login input' }, { status: 400 });
  }

  const user = await authenticateUser(parsed.data.username, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  await createSessionCookie(user);

  return NextResponse.json({ success: true, redirectTo: getDefaultRouteForRole(user.role), role: user.role });
}
