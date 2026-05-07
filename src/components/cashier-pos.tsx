'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ClipboardList, CreditCard, Pencil, ReceiptText, Search, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppSettings } from '@/lib/settings';
import { ProductImage } from '@/components/product-image';
import { Alert, Badge, Button, Card, CardContent, Dialog, DialogPanel, EmptyState, Input, Sheet, Textarea } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';

type ProductCategory = { id: string; name: string; slug: string; description: string | null; sortOrder: number; active: boolean };
type ProductWithCategory = { id: string; categoryId: string; name: string; slug: string; description: string | null; price: number; available: boolean; active: boolean; imageUrl: string | null; category: ProductCategory };
type CartItem = { productId: string; name: string; price: number; quantity: number; notes: string; imageUrl: string | null };
type ReceiptSummary = { orderId: string; orderNumber: string; subtotal: number; tax: number; taxRate: number; total: number; changeAmount: number; paymentStatus: string; status: string; receiptUrl: string };

// ─── Animation hook ──────────────────────────────────────────────────────────
// Delays unmounting so the exit animation can finish before the element is removed.
function useAnimatedOpen(open: boolean, duration = 300) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setRendered(true);
      // One frame delay so the browser paints the hidden state first,
      // then we flip visible → the transition fires.
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setRendered(false), duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration]);

  return { rendered, visible };
}

export function CashierPos({ products, settings }: { products: ProductWithCategory[]; settings: AppSettings }) {
  const router = useRouter();
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEOUT'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('T1');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptSummary | null>(null);
  const [search, setSearch] = useState('');
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const groupedProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filteredProducts = keyword.length ? products.filter((product) => `${product.name} ${product.description ?? ''} ${product.category.name}`.toLowerCase().includes(keyword)) : products;
    const groups = new Map<string, ProductWithCategory[]>();
    for (const product of filteredProducts) groups.set(product.category.name, [...(groups.get(product.category.name) ?? []), product]);
    return Array.from(groups.entries());
  }, [products, search]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Number((subtotal * ((settings.taxRate ?? 0) / 100)).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const received = Number(receivedAmount || 0);
  const change = Math.max(received - total, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: ProductWithCategory) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) return current.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { productId: product.id, name: product.name, price: product.price, quantity: 1, notes: '', imageUrl: product.imageUrl }];
    });
  }
  function updateCart(productId: string, changes: Partial<CartItem>) {
    setCart((current) => current.map((item) => (item.productId === productId ? { ...item, ...changes } : item)).filter((item) => item.quantity > 0));
  }
  function resetDraftState() {
    setCart([]); setReceivedAmount(''); setOrderNotes(''); setCustomerName(''); setTableNumber('T1'); setMobileOrderOpen(false); setCheckoutOpen(false);
  }
  function clearOrderDraft() { setError(null); resetDraftState(); }

  async function submitOrder() {
    setSubmitting(true); setError(null); setReceipt(null);
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderType, tableNumber, customerName, notes: orderNotes, paymentMethod: 'cash', receivedAmount: received, items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, notes: item.notes })) }) });
    const payload = (await response.json()) as { error?: string; order?: ReceiptSummary };
    setSubmitting(false);
    if (!response.ok || !payload.order) { setError(payload.error ?? 'Unable to place order'); return; }
    setReceipt(payload.order); resetDraftState(); router.refresh();
  }

  return (
    <>
      <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(0,1.7fr)_380px] xl:grid-cols-[minmax(0,1.9fr)_400px]">
        <MenuCatalog groupedProducts={groupedProducts} products={products} search={search} setSearch={setSearch} addToCart={addToCart} settings={settings} />
        <DesktopOrderPanel cart={cart} total={total} totalItems={totalItems} settings={settings} setCheckoutOpen={setCheckoutOpen} updateCart={updateCart} clearOrderDraft={clearOrderDraft} />
      </div>

      {/* ── Mobile FAB ── */}
      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <Button className="h-auto w-full justify-between rounded-[1.2rem] px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.28)]" onClick={() => { setMobileOrderOpen(true); setCheckoutOpen(false); }}>
          <div className="text-left"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">Open Orders</p><p className="mt-1 text-sm font-semibold">{totalItems} item{totalItems === 1 ? '' : 's'} • {formatCurrency(total, settings.currency)}</p></div>
          <span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold">View</span>
        </Button>
      </div>

      {/* ── Mobile Order Sheet — slides up from bottom ── */}
      <AnimatedSheet open={mobileOrderOpen} onClose={() => setMobileOrderOpen(false)}>
        <PanelHeader eyebrow="Step 1" title="Current Order" onClose={() => setMobileOrderOpen(false)} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4"><CartItems cart={cart} updateCart={updateCart} settings={settings} compact={false} /></div>
        <div className="border-t border-slate-200 px-4 py-3">
          <OrderSummaryBar total={total} totalItems={totalItems} settings={settings} compact={false} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearOrderDraft}><Trash2 className="h-4 w-4" />Clear</Button>
            <Button disabled={cart.length === 0} onClick={() => { setMobileOrderOpen(false); setTimeout(() => setCheckoutOpen(true), 200); }}><ReceiptText className="h-4 w-4" />Checkout</Button>
          </div>
        </div>
      </AnimatedSheet>

      {/* ── Checkout Dialog — scales + fades in ── */}
      <AnimatedDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        <PanelHeader eyebrow={mobileOrderOpen ? 'Step 2' : 'Checkout'} title="Checkout Details" subtitle="Payment, totals, and order info." onClose={() => setCheckoutOpen(false)} onBack={() => { if (window.innerWidth < 1024) { setCheckoutOpen(false); setMobileOrderOpen(true); } }} />
        <CardContent className="max-h-[72dvh] overflow-y-auto p-4 sm:p-5">
          <CheckoutForm orderType={orderType} setOrderType={setOrderType} tableNumber={tableNumber} setTableNumber={setTableNumber} customerName={customerName} setCustomerName={setCustomerName} orderNotes={orderNotes} setOrderNotes={setOrderNotes} subtotal={subtotal} tax={tax} total={total} receivedAmount={receivedAmount} setReceivedAmount={setReceivedAmount} change={change} error={error} clearOrderDraft={clearOrderDraft} submitOrder={submitOrder} submitting={submitting} canSubmit={cart.length > 0 && received >= total} settings={settings} />
        </CardContent>
      </AnimatedDialog>

      {receipt ? <ReceiptDialog receipt={receipt} settings={settings} close={() => setReceipt(null)} /> : null}
    </>
  );
}

// ─── AnimatedSheet ────────────────────────────────────────────────────────────
// Replaces <Sheet> with a custom overlay that slides in from the bottom.
function AnimatedSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const { rendered, visible } = useAnimatedOpen(open, 350);
  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop — fades in/out */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />
      {/* Panel — slides up from bottom */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col">
        <div
          className="mt-auto w-full transition-transform duration-350 ease-out"
          style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-[min(84dvh,84vh)] w-full flex-col overflow-hidden rounded-t-[1.5rem] border border-slate-200 bg-white shadow-2xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AnimatedDialog ───────────────────────────────────────────────────────────
// Replaces <Dialog> with a custom centered modal that scales + fades in.
function AnimatedDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const { rendered, visible } = useAnimatedOpen(open, 300);
  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />
      {/* Panel — scale + fade */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl transition-all duration-300"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function MenuCatalog({ groupedProducts, products, search, setSearch, addToCart, settings }: { groupedProducts: [string, ProductWithCategory[]][]; products: ProductWithCategory[]; search: string; setSearch: (value: string) => void; addToCart: (product: ProductWithCategory) => void; settings: AppSettings }) {
  return <Card className="min-h-0 overflow-hidden rounded-[1.5rem]"><CardContent className="flex h-full min-h-0 flex-col p-3 xl:p-4"><div className="mb-3 flex shrink-0 flex-col gap-3 border-b border-slate-200 pb-3 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5B6CFF]">Catalog</p><h2 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">Menu</h2><p className="text-xs text-slate-500">Tap products to build the current order quickly.</p></div><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="relative min-w-0 sm:w-[260px] xl:w-[300px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu, category, or item" className="h-10 rounded-2xl pl-10" /></div><Badge variant="outline" className="h-10 rounded-2xl px-3"><ClipboardList className="h-4 w-4" />{products.length} products</Badge></div></div><div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-24 lg:pb-0"><div className="space-y-4">{groupedProducts.length === 0 ? <EmptyState title="No menu items found" description={`No menu items matched ${search || 'your current filters'}.`} /> : null}{groupedProducts.map(([category, items]) => <div key={category}><div className="mb-2"><h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">{category}</h3><p className="text-[11px] text-slate-500">{items.length} item{items.length === 1 ? '' : 's'}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(145px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(155px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(165px,1fr))]">{items.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} currency={settings.currency} />)}</div></div>)}</div></div></CardContent></Card>;
}

function ProductCard({ product, onAdd, currency }: { product: ProductWithCategory; onAdd: (product: ProductWithCategory) => void; currency: string }) {
  return <button type="button" onClick={() => onAdd(product)} className="group overflow-hidden rounded-[1.1rem] border border-[var(--border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#C9D2FF] hover:shadow-md"><ProductImage src={product.imageUrl} alt={product.name} className="aspect-[4/3] w-full" sizes="(max-width: 640px) 50vw, 180px" /><div className="space-y-1.5 p-2.5"><div><p className="line-clamp-2 text-xs font-semibold text-slate-900 sm:text-sm">{product.name}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{product.description ?? 'Quick-serve menu item'}</p></div><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-[var(--primary)] sm:text-sm">{formatCurrency(product.price, currency)}</p><span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold text-[#4F5DE5] transition group-hover:bg-[var(--primary)] group-hover:text-white">Add</span></div></div></button>;
}

function CartItems({ cart, updateCart, settings, compact }: { cart: CartItem[]; updateCart: (productId: string, changes: Partial<CartItem>) => void; settings: AppSettings; compact: boolean }) {
  if (!cart.length) return <EmptyState title="No items yet" description="Tap a product to start the order." className="border-[var(--border)] bg-[var(--surface)]" />;
  return <div className="space-y-2">{cart.map((item) => <CartItemCard key={item.productId} item={item} updateCart={updateCart} currency={settings.currency} compact={compact} />)}</div>;
}

function CartItemCard({ item, updateCart, currency, compact }: { item: CartItem; updateCart: (productId: string, changes: Partial<CartItem>) => void; currency: string; compact: boolean }) {
  return <div className={cn('border border-slate-200 bg-slate-50/90 shadow-sm', compact ? 'rounded-xl p-2.5' : 'rounded-[1.25rem] p-3')}><div className="flex items-start gap-2.5"><ProductImage src={item.imageUrl} alt={item.name} className={cn('shrink-0 rounded-xl', compact ? 'h-11 w-11' : 'h-14 w-14 sm:h-16 sm:w-16')} sizes="64px" /><div className="min-w-0 flex-1 space-y-2"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className={cn('line-clamp-2 font-semibold text-slate-900', compact ? 'text-xs leading-4' : 'text-sm leading-5 sm:text-[15px]')}>{item.name}</p><p className="mt-1 text-[11px] text-slate-500">{formatCurrency(item.price, currency)} each</p></div><div className="rounded-lg bg-white px-2.5 py-1.5 text-right shadow-sm ring-1 ring-slate-200"><p className="text-[9px] uppercase tracking-[0.16em] text-slate-400">Line</p><p className={cn('font-bold text-slate-900', compact ? 'text-xs' : 'text-sm')}>{formatCurrency(item.price * item.quantity, currency)}</p></div></div><div className="flex flex-wrap items-center justify-between gap-2"><div className="inline-flex items-center rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-slate-200"><Button type="button" variant="ghost" size="icon" className={cn('rounded-lg', compact ? 'h-7 w-7' : 'h-8 w-8')} onClick={() => updateCart(item.productId, { quantity: item.quantity - 1 })}>-</Button><div className="min-w-8 px-2 text-center text-xs font-bold text-slate-900">{item.quantity}</div><Button type="button" variant="ghost" size="icon" className={cn('rounded-lg', compact ? 'h-7 w-7' : 'h-8 w-8')} onClick={() => updateCart(item.productId, { quantity: item.quantity + 1 })}>+</Button></div>{compact ? <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-xs" onClick={() => updateCart(item.productId, { notes: '' })}><Pencil className="h-3.5 w-3.5" />Note</Button> : <p className="text-[11px] text-slate-500">Adjust quantity</p>}</div><Input value={item.notes} onChange={(event) => updateCart(item.productId, { notes: event.target.value })} placeholder="Item note" className={cn('rounded-xl', compact ? 'h-8 text-xs' : 'h-9')} /></div></div></div>;
}

function DesktopOrderPanel({ cart, total, totalItems, settings, setCheckoutOpen, updateCart, clearOrderDraft }: { cart: CartItem[]; total: number; totalItems: number; settings: AppSettings; setCheckoutOpen: (value: boolean) => void; updateCart: (productId: string, changes: Partial<CartItem>) => void; clearOrderDraft: () => void }) {
  return <section className="hidden h-full min-h-0 lg:flex lg:flex-col"><Card className="flex h-full min-h-0 flex-col rounded-[1.5rem]"><CardContent className="flex h-full min-h-0 flex-col p-3"><div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 pb-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5B6CFF]">Current Order</p><h2 className="mt-1 text-base font-bold text-slate-900">Order Items</h2><p className="text-xs text-slate-500">Compact order summary.</p></div><Badge className="rounded-xl bg-[var(--primary)] px-2.5 py-1.5 text-white">{totalItems} items</Badge></div><div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1"><CartItems cart={cart} updateCart={updateCart} settings={settings} compact /></div><div className="mt-3 shrink-0 border-t border-slate-200 pt-3"><OrderSummaryBar total={total} totalItems={totalItems} settings={settings} compact /><div className="mt-2 grid gap-2"><Button disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)} className="w-full h-9 text-xs"><ReceiptText className="h-4 w-4" />Checkout</Button><Button variant="outline" onClick={clearOrderDraft} className="w-full h-9 text-xs"><Trash2 className="h-4 w-4" />Clear draft</Button></div></div></CardContent></Card></section>;
}

function OrderSummaryBar({ total, totalItems, settings, compact }: { total: number; totalItems: number; settings: AppSettings; compact: boolean }) {
  return <div className={cn('flex items-center justify-between bg-slate-50 ring-1 ring-slate-200/70', compact ? 'rounded-xl px-3 py-2.5' : 'rounded-[1.35rem] px-4 py-3')}><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Order Total</p><p className="mt-1 text-xs text-slate-600">{totalItems} item{totalItems === 1 ? '' : 's'}</p></div><p className={cn('font-bold text-slate-900', compact ? 'text-base' : 'text-lg')}>{formatCurrency(total, settings.currency)}</p></div>;
}

function CheckoutForm(props: { orderType: 'DINE_IN' | 'TAKEOUT'; setOrderType: (value: 'DINE_IN' | 'TAKEOUT') => void; tableNumber: string; setTableNumber: (value: string) => void; customerName: string; setCustomerName: (value: string) => void; orderNotes: string; setOrderNotes: (value: string) => void; subtotal: number; tax: number; total: number; receivedAmount: string; setReceivedAmount: (value: string) => void; change: number; error: string | null; clearOrderDraft: () => void; submitOrder: () => void; submitting: boolean; canSubmit: boolean; settings: AppSettings }) {
  const { orderType, setOrderType, tableNumber, setTableNumber, customerName, setCustomerName, orderNotes, setOrderNotes, subtotal, tax, total, receivedAmount, setReceivedAmount, change, error, clearOrderDraft, submitOrder, submitting, canSubmit, settings } = props;
  return <div className="space-y-4"><div className="grid grid-cols-2 gap-2">{(['DINE_IN', 'TAKEOUT'] as const).map((type) => <Button key={type} type="button" variant={orderType === type ? 'default' : 'secondary'} className={cn('rounded-2xl h-10', orderType !== type && 'text-slate-700')} onClick={() => setOrderType(type)}>{type === 'DINE_IN' ? 'Dine-in' : 'Takeout'}</Button>)}</div><div className="grid gap-3">{orderType === 'DINE_IN' ? <Input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Table Number" className="rounded-2xl" /> : <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name" className="rounded-2xl" />}<Textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Order note" className="min-h-20 rounded-2xl" /></div><div className="grid grid-cols-2 gap-3"><MetricCard label="Subtotal" value={formatCurrency(subtotal, settings.currency)} dark /><MetricCard label="Tax" value={formatCurrency(tax, settings.currency)} /></div><div className="rounded-[1.4rem] bg-[linear-gradient(135deg,#111439_0%,#3340B3_48%,#7C3AED_100%)] p-4 text-white shadow-[0_12px_30px_rgba(17,20,57,0.12)]"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-white/85"><ReceiptText className="h-4 w-4" /><span className="text-[11px] font-medium uppercase tracking-[0.22em]">Total Due</span></div><p className="text-xl font-bold">{formatCurrency(total, settings.currency)}</p></div></div><div className="grid gap-3"><div className="space-y-1.5"><span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"><CreditCard className="h-3.5 w-3.5" /> Cash Received</span><Input type="number" min="0" step="0.01" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} placeholder="0.00" className="rounded-2xl" /></div><div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-3 text-sm ring-1 ring-slate-200/70"><span className="text-slate-500">Change</span><span className="font-semibold text-slate-900">{formatCurrency(change, settings.currency)}</span></div></div>{error ? <Alert variant="destructive">{error}</Alert> : null}<div className="grid grid-cols-2 gap-2.5"><Button type="button" variant="outline" onClick={clearOrderDraft}><Trash2 className="h-4 w-4" />Clear</Button><Button type="button" disabled={submitting || !canSubmit} onClick={submitOrder}><ReceiptText className="h-4 w-4" />{submitting ? 'Placing...' : 'Place Order'}</Button></div></div>;
}

function MetricCard({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return <div className={cn('rounded-2xl p-3 ring-1', dark ? 'bg-[var(--primary)] text-white ring-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--foreground)] ring-[var(--border)]')}><p className={cn('text-[10px] uppercase tracking-[0.18em]', dark ? 'text-slate-300' : 'text-slate-500')}>{label}</p><p className="mt-1.5 text-lg font-bold">{value}</p></div>;
}

function PanelHeader({ eyebrow, title, subtitle, onClose, onBack }: { eyebrow: string; title: string; subtitle?: string; onClose: () => void; onBack?: () => void }) {
  return <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5B6CFF]">{eyebrow}</p><h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>{subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}</div><div className="flex items-center gap-2">{onBack ? <Button type="button" variant="outline" size="icon" className="lg:hidden" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button> : null}<Button type="button" variant="outline" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div></div>;
}

function ReceiptDialog({ receipt, settings, close }: { receipt: ReceiptSummary; settings: AppSettings; close: () => void }) {
  return <Dialog open><DialogPanel className="max-w-md overflow-hidden rounded-[1.5rem]"><div className="flex items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-sm"><CheckCircle2 className="h-5 w-5" /></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5B6CFF]">Order Complete</p><h3 className="mt-1 text-lg font-bold text-slate-900">Receipt ready</h3><p className="text-sm text-slate-500">Order #{receipt.orderNumber} is ready for receipt viewing or printing.</p></div></div><Button type="button" variant="outline" size="icon" className="border-[var(--border)] bg-white hover:bg-[var(--surface)]" onClick={close}><X className="h-4 w-4" /></Button></div><CardContent className="space-y-3 p-4"><div className="rounded-3xl bg-[linear-gradient(135deg,#111439_0%,#3340B3_48%,#7C3AED_100%)] p-4 text-white"><div className="flex items-center gap-2 text-white/85"><Sparkles className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-[0.22em]">Payment Summary</span></div><div className="mt-3 grid gap-2 text-sm"><div className="flex justify-between"><span className="text-white/78">Status</span><span className="font-semibold">{receipt.status}</span></div><div className="flex justify-between"><span className="text-white/78">Payment</span><span className="font-semibold">{receipt.paymentStatus}</span></div><div className="flex justify-between"><span className="text-white/78">Total</span><span className="font-semibold">{formatCurrency(receipt.total, settings.currency)}</span></div><div className="flex justify-between"><span className="text-white/78">Change</span><span className="font-semibold">{formatCurrency(receipt.changeAmount, settings.currency)}</span></div></div></div><Alert>You can open the printable receipt now, then continue taking the next order without losing your place in the cashier screen.</Alert><div className="grid gap-2 sm:grid-cols-2"><Link href={receipt.receiptUrl}><Button className="w-full"><ReceiptText className="h-4 w-4" />Open Receipt</Button></Link><Button type="button" variant="outline" onClick={close}>Done</Button></div></CardContent></DialogPanel></Dialog>;
}