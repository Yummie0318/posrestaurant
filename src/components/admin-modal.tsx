'use client';

import Link from 'next/link';
import { Dialog, DialogPanel, Button } from '@/components/ui';

type AdminModalProps = {
  title: string;
  description?: string;
  closeHref: string;
  children: React.ReactNode;
};

export function AdminModal({ title, description, closeHref, children }: AdminModalProps) {
  return (
    <Dialog open>
      <DialogPanel className="oc-panel">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <Link href={closeHref}><Button variant="outline">Close</Button></Link>
        </div>
        <div className="max-h-[80dvh] overflow-auto p-6">{children}</div>
      </DialogPanel>
    </Dialog>
  );
}
