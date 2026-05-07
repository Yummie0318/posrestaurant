import 'dotenv/config';
import { UserRole } from '@prisma/client';
import { db } from '../src/lib/db';

async function main() {
  const category = await db.category.create({
    data: {
      name: 'Seasonal Specials',
      slug: 'seasonal-specials',
      description: 'Temporary menu items for CRUD validation',
      sortOrder: 99,
      active: true,
    },
  });

  const product = await db.product.create({
    data: {
      categoryId: category.id,
      name: 'Special Pancit Fiesta',
      slug: 'special-pancit-fiesta',
      description: 'Admin CRUD test item',
      price: 199,
      available: true,
      active: true,
    },
  });

  const user = await db.user.create({
    data: {
      name: 'CRUD Test User',
      username: `crudtest_${Date.now()}`,
      passwordHash: 'placeholder-hash',
      role: UserRole.CASHIER,
      active: true,
    },
  });

  const updatedCategory = await db.category.update({
    where: { id: category.id },
    data: { name: 'Seasonal Specials Updated', active: false },
  });

  const updatedProduct = await db.product.update({
    where: { id: product.id },
    data: { price: 209, available: false },
  });

  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: { role: UserRole.KITCHEN, active: false },
  });

  await db.product.delete({ where: { id: product.id } });
  await db.category.delete({ where: { id: category.id } });
  await db.user.delete({ where: { id: user.id } });

  console.log(
    JSON.stringify(
      {
        category: { created: category.slug, updated: updatedCategory.name, deleted: true },
        product: { created: product.slug, updatedPrice: Number(updatedProduct.price), deleted: true },
        user: { created: user.username, updatedRole: updatedUser.role, deleted: true },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
