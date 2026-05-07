import Link from 'next/link';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { UserRole } from '@prisma/client';
import { AppShell } from '@/components/app-shell';
import { AdminModal } from '@/components/admin-modal';
import { PendingIconButton } from '@/components/form-actions';
import { UserForm } from '@/components/user-form';
import { deleteUserAction, saveUserAction } from '@/lib/admin-actions';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, EmptyState, Input, TD, TH } from '@/components/ui';

type UserSearchParams = { q?: string; userModal?: 'create' | 'edit'; userId?: string };
function buildHref(params: UserSearchParams) { const search = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value) search.set(key, value); }); const query = search.toString(); return query ? `/admin/users?${query}` : '/admin/users'; }

export default async function UsersPage({ searchParams }: { searchParams: Promise<UserSearchParams> }) {
  const user = await requireUser([UserRole.ADMIN]);
  const users = await db.user.findMany({ orderBy: [{ role: 'asc' }, { username: 'asc' }] });
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? '';
  const filteredUsers = users.filter((account) => query ? `${account.name} ${account.username} ${account.role}`.toLowerCase().includes(query) : true);
  const editingUser = params.userId ? users.find((account) => account.id === params.userId) ?? null : null;
  const closeHref = buildHref({ q: params.q });

  return <AppShell pathname="/admin/users" user={user} title="Users" subtitle="Control roles and account access with a shared admin UI system.">
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="grid shrink-0 gap-4 xl:grid-cols-[1fr_auto]">
        <Card><CardContent className="p-5"><form className="grid gap-3 md:grid-cols-[1fr_auto]"><Input name="q" defaultValue={params.q ?? ''} placeholder="Search name, username, or role" /><div className="flex gap-2"><Button>Search</Button><Link href="/admin/users"><Button type="button" variant="outline">Reset</Button></Link></div></form></CardContent></Card>
        <Link href={buildHref({ q: params.q, userModal: 'create' })}><Button><UserPlus className="h-4 w-4" />Add User</Button></Link>
      </div>
      <Card className="flex min-h-0 flex-col overflow-hidden"><CardHeader><CardTitle>User Management</CardTitle><CardDescription>{filteredUsers.length} account{filteredUsers.length === 1 ? '' : 's'}</CardDescription></CardHeader><CardContent className="min-h-0 flex-1 overflow-auto">{filteredUsers.length ? <><div className="space-y-3 md:hidden">{filteredUsers.map((account) => <div key={account.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{account.name}</p><p className="text-sm text-slate-500">@{account.username}</p></div><Badge variant={account.active ? 'success' : 'outline'}>{account.active ? 'Active' : 'Inactive'}</Badge></div><div className="mt-3 flex items-center gap-2"><Badge variant="outline">{account.role}</Badge></div><div className="mt-4 flex gap-2"><Link href={buildHref({ q: params.q, userModal: 'edit', userId: account.id })}><Button type="button" variant="outline" size="icon" aria-label="Edit user"><Pencil className="h-4 w-4" /></Button></Link><form action={deleteUserAction}><input type="hidden" name="id" value={account.id} /><PendingIconButton variant="destructive" size="icon" aria-label="Delete user" pendingLabel="Deleting user"><Trash2 className="h-4 w-4" /></PendingIconButton></form></div></div>)}</div><div className="hidden md:block"><DataTable><thead className="sticky top-0 bg-white"><tr><TH>Name</TH><TH>Username</TH><TH>Role</TH><TH>Status</TH><TH>Actions</TH></tr></thead><tbody>{filteredUsers.map((account) => <tr key={account.id} className="border-t border-slate-100"><TD className="font-semibold text-slate-900">{account.name}</TD><TD>@{account.username}</TD><TD><Badge variant="outline">{account.role}</Badge></TD><TD><Badge variant={account.active ? 'success' : 'outline'}>{account.active ? 'Active' : 'Inactive'}</Badge></TD><TD><div className="flex gap-2"><Link href={buildHref({ q: params.q, userModal: 'edit', userId: account.id })}><Button type="button" variant="outline" size="icon" aria-label="Edit user"><Pencil className="h-4 w-4" /></Button></Link><form action={deleteUserAction}><input type="hidden" name="id" value={account.id} /><PendingIconButton variant="destructive" size="icon" aria-label="Delete user" pendingLabel="Deleting user"><Trash2 className="h-4 w-4" /></PendingIconButton></form></div></TD></tr>)}</tbody></DataTable></div></> : <EmptyState title="No users found" description="Try a broader search or create a new staff account." />}</CardContent></Card>
      {params.userModal === 'create' ? <AdminModal title="Add User" description="Create a new staff account." closeHref={closeHref}><UserForm action={saveUserAction} /></AdminModal> : null}
      {params.userModal === 'edit' && editingUser ? <AdminModal title="Edit User" description="Update staff details and access." closeHref={closeHref}><UserForm action={saveUserAction} user={editingUser} /></AdminModal> : null}
    </div>
  </AppShell>;
}
