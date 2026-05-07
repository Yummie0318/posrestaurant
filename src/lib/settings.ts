import { db } from '@/lib/db';

export type AppSettings = {
  storeName: string;
  businessAddress: string;
  currency: string;
  taxRate: number;
  receiptFooter: string;
};

const defaults: AppSettings = {
  storeName: 'PosPancitan Demo Store',
  businessAddress: 'Panciteria Main Branch',
  currency: 'PHP',
  taxRate: 0,
  receiptFooter: 'Thank you for dining with us!',
};

export async function getAppSettings(): Promise<AppSettings> {
  const settings = await db.setting.findMany();
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return {
    storeName: map.get('store_name') ?? defaults.storeName,
    businessAddress: map.get('business_address') ?? defaults.businessAddress,
    currency: map.get('currency') ?? defaults.currency,
    taxRate: Number(map.get('tax_rate') ?? defaults.taxRate),
    receiptFooter: map.get('receipt_footer') ?? defaults.receiptFooter,
  };
}
