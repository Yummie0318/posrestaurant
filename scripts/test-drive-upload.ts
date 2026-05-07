import { readFile } from 'node:fs/promises';
import { db } from '@/lib/db';
import { deleteDriveFile, extractDriveFileId, uploadProductImage } from '@/lib/google-drive';

async function main() {
  const category = await db.category.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!category) throw new Error('No category found to attach a test product to.');

  const imagePath = 'C:/Users/Yummie03/Desktop/pospancitan/test.jpg';
  const buffer = await readFile(imagePath);
  const file = new File([new Uint8Array(buffer)], 'test.jpg', { type: 'image/jpeg' });

  const upload = await uploadProductImage(file, 'drive-test-item');
  console.log('UPLOAD_OK', upload);

  const created = await db.product.create({
    data: {
      categoryId: category.id,
      name: `Drive Test ${Date.now()}`,
      slug: `drive-test-${Date.now()}`,
      description: 'Temporary upload test product',
      price: 99,
      imageUrl: upload.imageUrl,
      available: true,
      active: true,
    },
  });
  console.log('CREATE_OK', created.id, created.imageUrl);

  const replacement = await uploadProductImage(file, `${created.slug}-replacement`);
  const oldId = extractDriveFileId(created.imageUrl);
  if (oldId) await deleteDriveFile(oldId);
  const updated = await db.product.update({ where: { id: created.id }, data: { imageUrl: replacement.imageUrl } });
  console.log('UPDATE_OK', updated.id, updated.imageUrl);

  const replacementId = extractDriveFileId(updated.imageUrl);
  console.log('FINAL_FILE_ID', replacementId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
