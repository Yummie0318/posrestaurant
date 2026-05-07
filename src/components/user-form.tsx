'use client';

import { UserRole } from '@prisma/client';
import { Input, Label, Select } from '@/components/ui';
import { SubmitButton } from '@/components/form-actions';

export function UserForm({ action, user }: { action: (formData: FormData) => Promise<void>; user?: { id: string; name: string; username: string; role: UserRole; active: boolean } }) {
  return <form action={action} className="grid gap-4">{user ? <input type="hidden" name="id" value={user.id} /> : null}<div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><Label>Name</Label><Input name="name" defaultValue={user?.name} required /></div><div className="grid gap-2"><Label>Username</Label><Input name="username" defaultValue={user?.username} required /></div></div><div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><Label>Password</Label><Input name="password" type="password" placeholder={user ? 'Leave blank to keep current password' : 'Temporary password'} required={!user} /></div><div className="grid gap-2"><Label>Role</Label><Select name="role" defaultValue={user?.role ?? UserRole.CASHIER}>{Object.values(UserRole).map((role) => <option key={role} value={role}>{role}</option>)}</Select></div></div><label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm"><input name="active" type="checkbox" defaultChecked={user?.active ?? true} /> Active</label><SubmitButton pendingText={user ? 'Updating user...' : 'Saving user...'}>{user ? 'Update User' : 'Save User'}</SubmitButton></form>;
}
