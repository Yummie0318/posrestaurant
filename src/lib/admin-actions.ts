'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteDriveFile, extractDriveFileId, uploadProductImage } from '@/lib/google-drive';
import { categoryFormSchema, productFormSchema, userFormSchema } from '@/lib/validators';

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function getNumber(formData: FormData, key: string): number {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : 0;
}

function getBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on';
}

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function ensureAdmin(): Promise<void> {
  await requireUser([UserRole.ADMIN]);
}

export async function saveCategoryAction(formData: FormData): Promise<void> {
  await ensureAdmin();

  const parsed = categoryFormSchema.parse({
    id: getString(formData, 'id') || undefined,
    name: getString(formData, 'name'),
    slug: getString(formData, 'slug'),
    description: getString(formData, 'description'),
    sortOrder: getNumber(formData, 'sortOrder'),
    active: getBoolean(formData, 'active'),
  });

  if (parsed.id) {
    await db.category.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description || null,
        sortOrder: parsed.sortOrder,
        active: parsed.active,
      },
    });
  } else {
    await db.category.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description || null,
        sortOrder: parsed.sortOrder,
        active: parsed.active,
      },
    });
  }

  revalidatePath('/admin/menu');
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = getString(formData, 'id');
  if (!id) throw new Error('Category id is required');

  const productCount = await db.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error('Cannot delete a category that still has products');
  }

  await db.category.delete({ where: { id } });
  revalidatePath('/admin/menu');
}

export async function saveProductAction(formData: FormData): Promise<void> {
  await ensureAdmin();

  const parsed = productFormSchema.parse({
    id: getString(formData, 'id') || undefined,
    categoryId: getString(formData, 'categoryId'),
    name: getString(formData, 'name'),
    slug: getString(formData, 'slug'),
    description: getString(formData, 'description'),
    price: getNumber(formData, 'price'),
    imageUrl: undefined,
    available: getBoolean(formData, 'available'),
    active: getBoolean(formData, 'active'),
  });

  const uploadedFile = getFile(formData, 'image');
  const removeImage = getBoolean(formData, 'removeImage');
  const existing = parsed.id ? await db.product.findUnique({ where: { id: parsed.id }, select: { imageUrl: true } }) : null;
  let nextImageUrl = existing?.imageUrl ?? null;

  if (removeImage && nextImageUrl) {
    const oldDriveId = extractDriveFileId(nextImageUrl);
    if (oldDriveId) await deleteDriveFile(oldDriveId).catch(() => null);
    nextImageUrl = null;
  }

  if (uploadedFile) {
    const upload = await uploadProductImage(uploadedFile, parsed.slug || parsed.name);
    const oldDriveId = extractDriveFileId(nextImageUrl);
    if (oldDriveId) await deleteDriveFile(oldDriveId).catch(() => null);
    nextImageUrl = upload.imageUrl;
  }

  if (parsed.id) {
    await db.product.update({
      where: { id: parsed.id },
      data: {
        categoryId: parsed.categoryId,
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description || null,
        price: parsed.price,
        imageUrl: nextImageUrl,
        available: parsed.available,
        active: parsed.active,
      },
    });
  } else {
    await db.product.create({
      data: {
        categoryId: parsed.categoryId,
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description || null,
        price: parsed.price,
        imageUrl: nextImageUrl,
        available: parsed.available,
        active: parsed.active,
      },
    });
  }

  revalidatePath('/admin/menu');
  revalidatePath('/cashier');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = getString(formData, 'id');
  if (!id) throw new Error('Product id is required');

  const existing = await db.product.findUnique({ where: { id }, select: { imageUrl: true } });
  const oldDriveId = extractDriveFileId(existing?.imageUrl);
  if (oldDriveId) await deleteDriveFile(oldDriveId).catch(() => null);

  await db.product.delete({ where: { id } });
  revalidatePath('/admin/menu');
  revalidatePath('/cashier');
}

export async function saveUserAction(formData: FormData): Promise<void> {
  await ensureAdmin();

  const parsed = userFormSchema.parse({
    id: getString(formData, 'id') || undefined,
    name: getString(formData, 'name'),
    username: getString(formData, 'username'),
    password: getString(formData, 'password'),
    role: getString(formData, 'role') as UserRole,
    active: getBoolean(formData, 'active'),
  });

  if (parsed.id) {
    const data: {
      name: string;
      username: string;
      role: UserRole;
      active: boolean;
      passwordHash?: string;
    } = {
      name: parsed.name,
      username: parsed.username,
      role: parsed.role,
      active: parsed.active,
    };

    if (parsed.password) {
      data.passwordHash = await bcrypt.hash(parsed.password, 10);
    }

    await db.user.update({ where: { id: parsed.id }, data });
  } else {
    if (!parsed.password) {
      throw new Error('Password is required when creating a user');
    }

    await db.user.create({
      data: {
        name: parsed.name,
        username: parsed.username,
        role: parsed.role,
        active: parsed.active,
        passwordHash: await bcrypt.hash(parsed.password, 10),
      },
    });
  }

  revalidatePath('/admin/users');
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const id = getString(formData, 'id');
  if (!id) throw new Error('User id is required');

  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.username === 'admin') {
    throw new Error('Seed admin user cannot be deleted');
  }

  await db.user.delete({ where: { id } });
  revalidatePath('/admin/users');
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  await ensureAdmin();

  const entries = [
    { key: 'store_name', value: getString(formData, 'store_name') || 'PosPancitan Demo Store' },
    { key: 'tax_rate', value: getString(formData, 'tax_rate') || '0' },
    { key: 'currency', value: getString(formData, 'currency') || 'PHP' },
    { key: 'receipt_footer', value: getString(formData, 'receipt_footer') || 'Thank you for dining with us!' },
    { key: 'business_address', value: getString(formData, 'business_address') || 'Panciteria Main Branch' },
  ];

  await db.$transaction(
    entries.map((entry) =>
      db.setting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: entry,
      }),
    ),
  );

  revalidatePath('/admin/settings');
  revalidatePath('/admin/orders');
  revalidatePath('/cashier');
  revalidatePath('/admin/reports');
  redirect('/admin/settings?saved=1');
}
