import { redirect } from 'next/navigation';
import { getSessionUser, getDefaultRouteForRole } from '@/lib/auth';

export default async function HomePage() {
  const user = await getSessionUser();
  redirect(user ? getDefaultRouteForRole(user.role) : '/login');
}
