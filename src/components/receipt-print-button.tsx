'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui';

export function ReceiptPrintButton() {
  return <Button type="button" onClick={() => window.print()}><Printer className="h-4 w-4" />Print Receipt</Button>;
}
