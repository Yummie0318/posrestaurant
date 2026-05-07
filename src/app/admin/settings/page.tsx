import { UserRole } from '@prisma/client';
import { AppShell } from '@/components/app-shell';
import { saveSettingsAction } from '@/lib/admin-actions';
import { requireUser } from '@/lib/auth';
import { getAppSettings } from '@/lib/settings';
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/form-actions';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser([UserRole.ADMIN]);
  const settings = await getAppSettings();
  const params = await searchParams;
  const saved = params.saved === '1';
  return <AppShell pathname="/admin/settings" user={user} title="Settings" subtitle="Configure store-wide values used by checkout, receipts, and reports.">
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {saved ? <Alert variant="success">Settings saved successfully.</Alert> : null}
      <Card>
        <CardHeader><CardTitle>Store Configuration</CardTitle><CardDescription>These values feed cashier totals, printable receipts, and reporting labels.</CardDescription></CardHeader>
        <CardContent>
          <form action={saveSettingsAction} className="grid gap-4">
            <div className="grid gap-2"><Label>Store Name</Label><Input name="store_name" defaultValue={settings.storeName} /></div>
            <div className="grid gap-2"><Label>Business Address</Label><Input name="business_address" defaultValue={settings.businessAddress} /></div>
            <div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><Label>Currency</Label><Input name="currency" defaultValue={settings.currency} /></div><div className="grid gap-2"><Label>Tax Rate (%)</Label><Input name="tax_rate" type="number" min="0" step="0.01" defaultValue={settings.taxRate} /></div></div>
            <div className="grid gap-2"><Label>Receipt Footer</Label><Textarea name="receipt_footer" defaultValue={settings.receiptFooter} /></div>
            <div className="flex justify-end"><SubmitButton pendingText="Saving settings...">Save Settings</SubmitButton></div>
          </form>
        </CardContent>
      </Card>
    </div>
  </AppShell>;
}
