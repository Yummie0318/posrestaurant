'use client';

import { Input, Label, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/form-actions';

export function CategoryForm({ action, category }: { action: (formData: FormData) => Promise<void>; category?: { id: string; name: string; slug: string; description: string | null; sortOrder: number; active: boolean } }) {
  return <form action={action} className="grid gap-4">{category ? <input type="hidden" name="id" value={category.id} /> : null}<div className="grid gap-2"><Label>Name</Label><Input name="name" defaultValue={category?.name} required /></div><div className="grid gap-2"><Label>Slug</Label><Input name="slug" defaultValue={category?.slug} required /></div><div className="grid gap-2"><Label>Description</Label><Textarea name="description" defaultValue={category?.description ?? ''} /></div><div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><Label>Sort order</Label><Input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} /></div><label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm"><input name="active" type="checkbox" defaultChecked={category?.active ?? true} /> Active</label></div><SubmitButton pendingText={category ? 'Updating category...' : 'Saving category...'}>{category ? 'Update Category' : 'Save Category'}</SubmitButton></form>;
}
