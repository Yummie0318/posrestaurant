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
    <>
      <style>{`
        @keyframes modal-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-panel-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .modal-backdrop {
          animation: modal-backdrop-in 0.2s ease both;
        }
        .modal-panel {
          animation: modal-panel-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      <Dialog open>
        {/* Animated backdrop overlay */}
        <div className="modal-backdrop fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

        {/* Centered panel wrapper */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="modal-panel oc-panel w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
              </div>
              <Link href={closeHref}><Button variant="outline">Close</Button></Link>
            </div>
            <div className="max-h-[80dvh] overflow-auto p-6">{children}</div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}