'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'; size?: 'default' | 'sm' | 'lg' | 'icon' }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        variant === 'default' && 'border border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-strong)]',
        variant === 'secondary' && 'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]',
        variant === 'outline' && 'border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--surface)]',
        variant === 'ghost' && 'text-[var(--foreground)] hover:bg-[var(--surface)]',
        variant === 'destructive' && 'border border-red-200 bg-[var(--danger-surface)] text-[var(--danger)] hover:bg-red-100',
        size === 'default' && 'h-10 px-4 py-2',
        size === 'sm' && 'h-9 px-3',
        size === 'lg' && 'h-11 px-5 text-sm',
        size === 'icon' && 'h-10 w-10',
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('flex h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('flex min-h-24 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]', className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('flex h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]', className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-[var(--foreground)]', className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_2px_rgba(17,20,57,0.04)]', className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />; }
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 className={cn('text-lg font-semibold tracking-tight text-[var(--foreground)]', className)} {...props} />; }
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p className={cn('text-sm text-slate-500', className)} {...props} />; }
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('p-6 pt-0', className)} {...props} />; }

export function Badge({ className, variant = 'secondary', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }) {
  return <div className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', variant === 'secondary' && 'bg-[var(--surface)] text-[var(--foreground)]', variant === 'success' && 'bg-emerald-50 text-emerald-700', variant === 'warning' && 'bg-[var(--warning-surface)] text-[var(--warning)]', variant === 'destructive' && 'bg-[var(--danger-surface)] text-[var(--danger)]', variant === 'outline' && 'border border-[var(--border)] text-[var(--foreground)]', className)} {...props} />;
}

export function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('h-px w-full bg-[var(--border)]', className)} {...props} />; }

export function Alert({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' | 'success' }) {
  return <div className={cn('rounded-2xl border px-4 py-3 text-sm', variant === 'default' && 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]', variant === 'destructive' && 'border-red-200 bg-[var(--danger-surface)] text-[var(--danger)]', variant === 'success' && 'border-emerald-200 bg-[var(--success-surface)] text-[var(--success)]', className)} {...props} />;
}

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) { return <div className={cn('rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center', className)}><p className='font-semibold text-[var(--foreground)]'>{title}</p><p className='mt-1 text-sm text-slate-500'>{description}</p></div>; }
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('animate-pulse rounded-xl bg-slate-200/80', className)} {...props} />; }

export function DataTable({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) { return <div className='overflow-x-auto'><table className={cn('min-w-full text-sm', className)} {...props} /></div>; }
export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) { return <th className={cn('pb-3 pr-4 text-left text-xs font-medium uppercase tracking-wide text-slate-500', className)} {...props} />; }
export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) { return <td className={cn('py-3 pr-4 align-top text-slate-700', className)} {...props} />; }

export function Dialog({ open, children }: { open: boolean; children: React.ReactNode }) { if (!open) return null; return <div className='oc-overlay fixed inset-0 z-50 bg-[rgba(17,20,57,0.32)] p-4 backdrop-blur-sm'>{children}</div>; }
export function DialogPanel({ className, children }: { className?: string; children: React.ReactNode }) { return <div className='flex h-full items-end justify-center sm:items-center'><div className={cn('oc-panel w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-white shadow-2xl', className)}>{children}</div></div>; }

export function Sheet({ open, children }: { open: boolean; children: React.ReactNode }) { if (!open) return null; return <div className='oc-overlay fixed inset-0 z-50 bg-[rgba(17,20,57,0.28)] backdrop-blur-sm lg:hidden'>{children}</div>; }
export function SheetPanel({ className, children }: { className?: string; children: React.ReactNode }) { return <div className={cn('ml-auto h-full w-[92vw] max-w-md border-l border-[var(--border)] bg-white shadow-2xl', className)}>{children}</div>; }
