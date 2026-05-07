import Link from 'next/link';
import { FolderPlus, PackagePlus, Pencil, Trash2, Plus } from 'lucide-react';
import { UserRole } from '@prisma/client';
import { AppShell } from '@/components/app-shell';
import { AdminModal } from '@/components/admin-modal';
import { CategoryForm } from '@/components/category-form';
import { PendingIconButton } from '@/components/form-actions';
import { ProductImage } from '@/components/product-image';
import { ProductForm } from '@/components/product-form';
import { deleteCategoryAction, deleteProductAction, saveCategoryAction, saveProductAction } from '@/lib/admin-actions';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, EmptyState, Input, TD, TH } from '@/components/ui';

type MenuSearchParams = { q?: string; categoryModal?: 'create' | 'edit'; categoryId?: string; productModal?: 'create' | 'edit'; productId?: string; tab?: 'categories' | 'products' };
function buildHref(params: MenuSearchParams) { const search = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value) search.set(key, value); }); const query = search.toString(); return query ? `/admin/menu?${query}` : '/admin/menu'; }

export default async function MenuPage({ searchParams }: { searchParams: Promise<MenuSearchParams> }) {
  const user = await requireUser([UserRole.ADMIN]);
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? '';
  const activeTab = params.tab ?? 'categories';

  const [categories, products] = await Promise.all([
    db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    db.product.findMany({ include: { category: true }, orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }] }),
  ]);

  const filteredCategories = categories.filter((category) =>
    query ? `${category.name} ${category.slug} ${category.description ?? ''}`.toLowerCase().includes(query) : true
  );
  const filteredProducts = products.filter((product) =>
    query ? `${product.name} ${product.slug} ${product.description ?? ''} ${product.category.name}`.toLowerCase().includes(query) : true
  );

  const editingCategory = params.categoryId ? categories.find((c) => c.id === params.categoryId) ?? null : null;
  const rawEditingProduct = params.productId ? products.find((p) => p.id === params.productId) ?? null : null;
  const editingProduct = rawEditingProduct ? {
    id: rawEditingProduct.id,
    categoryId: rawEditingProduct.categoryId,
    name: rawEditingProduct.name,
    slug: rawEditingProduct.slug,
    description: rawEditingProduct.description,
    price: Number(rawEditingProduct.price),
    imageUrl: rawEditingProduct.imageUrl,
    available: rawEditingProduct.available,
    active: rawEditingProduct.active,
  } : null;

  const closeHref = buildHref({ q: params.q, tab: activeTab });

  return (
    <AppShell pathname="/admin/menu" user={user} title="Menu Management" subtitle="Standardized catalog tools for categories, products, availability, and pricing.">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">

        {/* Search bar */}
        <Card className="shrink-0">
          <CardContent className="p-4">
            <form className="flex gap-2">
              <Input name="q" defaultValue={params.q ?? ''} placeholder="Search product, slug, or category" className="flex-1" />
              {/* Preserve tab in search */}
              {activeTab !== 'categories' && <input type="hidden" name="tab" value={activeTab} />}
              <Button>Search</Button>
              <Link href={buildHref({ tab: activeTab })}>
                <Button type="button" variant="outline">Reset</Button>
              </Link>
            </form>
          </CardContent>
        </Card>

        {/* Mobile Tab Switcher */}
        <div className="flex shrink-0 rounded-xl border border-slate-200 bg-slate-100 p-1 xl:hidden">
          <Link
            href={buildHref({ q: params.q, tab: 'categories' })}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FolderPlus className="h-4 w-4" />
            Categories
            <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {filteredCategories.length}
            </span>
          </Link>
          <Link
            href={buildHref({ q: params.q, tab: 'products' })}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PackagePlus className="h-4 w-4" />
            Products
            <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {filteredProducts.length}
            </span>
          </Link>
        </div>

        {/* Content grid */}
        <div className="grid min-h-0 gap-4 xl:grid-cols-[0.72fr_1.28fr]">

          {/* ── CATEGORIES CARD ── */}
          <Card className={`flex min-h-0 flex-col overflow-hidden ${activeTab !== 'categories' ? 'hidden xl:flex' : 'flex'}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>{filteredCategories.length} categories</CardDescription>
              </div>
              <Link href={buildHref({ q: params.q, tab: activeTab, categoryModal: 'create' })}>
                <Button size="icon" variant="outline" aria-label="Create category" title="Create Category">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 overflow-auto">
              {filteredCategories.length ? (
                <>
                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {filteredCategories.map((category) => (
                      <div key={category.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{category.name}</p>
                            <p className="text-sm text-slate-500">{category.description ?? 'No description'}</p>
                          </div>
                          <Badge variant={category.active ? 'success' : 'outline'}>{category.active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="mt-3 flex justify-between text-sm">
                          <span className="text-slate-500">Slug</span><span>{category.slug}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-slate-500">Sort</span><span>{category.sortOrder}</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Link href={buildHref({ q: params.q, tab: activeTab, categoryModal: 'edit', categoryId: category.id })}>
                            <Button type="button" variant="outline" size="icon" aria-label="Edit category"><Pencil className="h-4 w-4" /></Button>
                          </Link>
                          <form action={deleteCategoryAction}>
                            <input type="hidden" name="id" value={category.id} />
                            <PendingIconButton variant="destructive" size="icon" aria-label="Delete category" pendingLabel="Deleting category">
                              <Trash2 className="h-4 w-4" />
                            </PendingIconButton>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <DataTable>
                      <thead className="sticky top-0 bg-white">
                        <tr><TH>Name</TH><TH>Slug</TH><TH>Status</TH><TH>Sort</TH><TH>Actions</TH></tr>
                      </thead>
                      <tbody>
                        {filteredCategories.map((category) => (
                          <tr key={category.id} className="border-t border-slate-100">
                            <TD>
                              <p className="font-semibold text-slate-900">{category.name}</p>
                              <p className="text-xs text-slate-500">{category.description ?? 'No description'}</p>
                            </TD>
                            <TD className="text-slate-500">{category.slug}</TD>
                            <TD><Badge variant={category.active ? 'success' : 'outline'}>{category.active ? 'Active' : 'Inactive'}</Badge></TD>
                            <TD>{category.sortOrder}</TD>
                            <TD>
                              <div className="flex gap-2">
                                <Link href={buildHref({ q: params.q, tab: activeTab, categoryModal: 'edit', categoryId: category.id })}>
                                  <Button type="button" variant="outline" size="icon" aria-label="Edit category"><Pencil className="h-4 w-4" /></Button>
                                </Link>
                                <form action={deleteCategoryAction}>
                                  <input type="hidden" name="id" value={category.id} />
                                  <PendingIconButton variant="destructive" size="icon" aria-label="Delete category" pendingLabel="Deleting category">
                                    <Trash2 className="h-4 w-4" />
                                  </PendingIconButton>
                                </form>
                              </div>
                            </TD>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  </div>
                </>
              ) : (
                <EmptyState title="No categories found" description="Add a category first to organize your menu." />
              )}
            </CardContent>
          </Card>

          {/* ── PRODUCTS CARD ── */}
          <Card className={`flex min-h-0 flex-col overflow-hidden ${activeTab !== 'products' ? 'hidden xl:flex' : 'flex'}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>{filteredProducts.length} products</CardDescription>
              </div>
              <Link href={buildHref({ q: params.q, tab: activeTab, productModal: 'create' })}>
                <Button size="icon" aria-label="Create product" title="Create Product">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 overflow-auto">
              {filteredProducts.length ? (
                <>
                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <ProductImage src={product.imageUrl} alt={product.name} className="h-14 w-16 rounded-xl" sizes="64px" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">{product.name}</p>
                            <p className="text-sm text-slate-500">{product.description ?? 'No description'}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge variant="outline">{product.category.name}</Badge>
                              <Badge variant={product.available ? 'success' : 'outline'}>{product.available ? 'Available' : 'Unavailable'}</Badge>
                              <Badge variant={product.active ? 'secondary' : 'outline'}>{product.active ? 'Active' : 'Inactive'}</Badge>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{formatCurrency(Number(product.price))}</span>
                              <div className="flex gap-2">
                                <Link href={buildHref({ q: params.q, tab: activeTab, productModal: 'edit', productId: product.id })}>
                                  <Button type="button" variant="outline" size="icon" aria-label="Edit product"><Pencil className="h-4 w-4" /></Button>
                                </Link>
                                <form action={deleteProductAction}>
                                  <input type="hidden" name="id" value={product.id} />
                                  <PendingIconButton variant="destructive" size="icon" aria-label="Delete product" pendingLabel="Deleting product">
                                    <Trash2 className="h-4 w-4" />
                                  </PendingIconButton>
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <DataTable>
                      <thead className="sticky top-0 bg-white">
                        <tr><TH>Item</TH><TH>Category</TH><TH>Slug</TH><TH>Price</TH><TH>Availability</TH><TH>Actions</TH></tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="border-t border-slate-100">
                            <TD>
                              <div className="flex items-start gap-3">
                                <ProductImage src={product.imageUrl} alt={product.name} className="h-12 w-14 rounded-xl" sizes="56px" />
                                <div>
                                  <p className="font-semibold text-slate-900">{product.name}</p>
                                  <p className="text-xs text-slate-500">{product.description ?? 'No description'}</p>
                                </div>
                              </div>
                            </TD>
                            <TD>{product.category.name}</TD>
                            <TD className="text-slate-500">{product.slug}</TD>
                            <TD className="font-semibold">{formatCurrency(Number(product.price))}</TD>
                            <TD>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant={product.available ? 'success' : 'outline'}>{product.available ? 'Available' : 'Unavailable'}</Badge>
                                <Badge variant={product.active ? 'secondary' : 'outline'}>{product.active ? 'Active' : 'Inactive'}</Badge>
                              </div>
                            </TD>
                            <TD>
                              <div className="flex gap-2">
                                <Link href={buildHref({ q: params.q, tab: activeTab, productModal: 'edit', productId: product.id })}>
                                  <Button type="button" variant="outline" size="icon" aria-label="Edit product"><Pencil className="h-4 w-4" /></Button>
                                </Link>
                                <form action={deleteProductAction}>
                                  <input type="hidden" name="id" value={product.id} />
                                  <PendingIconButton variant="destructive" size="icon" aria-label="Delete product" pendingLabel="Deleting product">
                                    <Trash2 className="h-4 w-4" />
                                  </PendingIconButton>
                                </form>
                              </div>
                            </TD>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  </div>
                </>
              ) : (
                <EmptyState title="No products found" description="Try a different search term or create a new product." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {params.categoryModal === 'create' ? <AdminModal title="Create Category" description="Add a new category to standardize menu grouping." closeHref={closeHref}><CategoryForm action={saveCategoryAction} /></AdminModal> : null}
      {params.categoryModal === 'edit' && editingCategory ? <AdminModal title="Update Category" description="Edit category details." closeHref={closeHref}><CategoryForm action={saveCategoryAction} category={editingCategory} /></AdminModal> : null}
      {params.productModal === 'create' ? <AdminModal title="Create Product" description="Add a product with pricing, availability, and uploaded image." closeHref={closeHref}><ProductForm action={saveProductAction} categories={categories} /></AdminModal> : null}
      {params.productModal === 'edit' && editingProduct ? <AdminModal title="Update Product" description="Edit product details, image, and availability." closeHref={closeHref}><ProductForm action={saveProductAction} categories={categories} product={editingProduct} /></AdminModal> : null}
    </AppShell>
  );
}