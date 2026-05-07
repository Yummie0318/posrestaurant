'use client';

import { RouteErrorState } from '@/components/route-error-state';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState title="Kitchen board failed to load" message={error.message || 'The kitchen queue could not be loaded.'} onRetry={reset} />;
}
