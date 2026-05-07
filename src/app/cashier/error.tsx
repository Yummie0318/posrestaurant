'use client';

import { RouteErrorState } from '@/components/route-error-state';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState title="Cashier screen failed to load" message={error.message || 'The POS workspace could not be loaded.'} onRetry={reset} />;
}
