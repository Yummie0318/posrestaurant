import { UserRole } from '@prisma/client';
import { CashierPos } from '@/components/cashier-pos';
import { AppShell } from '@/components/app-shell';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getAppSettings } from '@/lib/settings';

export default async function CashierPage() {
  const user = await requireUser([UserRole.ADMIN, UserRole.CASHIER]);
  const [products, settings] = await Promise.all([
    db.product.findMany({
      where: { active: true, available: true, category: { active: true } },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    }),
    getAppSettings(),
  ]);

  const serializedProducts = products.map((product) => ({
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: Number(product.price),
    available: product.available,
    active: product.active,
    imageUrl: product.imageUrl,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
      description: product.category.description,
      sortOrder: product.category.sortOrder,
      active: product.category.active,
    },
  }));

  return (
    <AppShell
      pathname="/cashier"
      user={user}
      variant="pos"
      hideSidebar={user.role === UserRole.CASHIER}
      headerLogout={user.role === UserRole.CASHIER}
      title="Cashier POS"
      subtitle="Menu on the left, order items on the right, with checkout handled in a focused modal."
    >
      <CashierPos products={serializedProducts} settings={settings} />
    </AppShell>
  );
}
