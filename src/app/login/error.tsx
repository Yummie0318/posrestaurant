'use client';

import { RouteErrorState } from '@/components/route-error-state';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState title="Login page failed to load" message={error.message || 'The sign-in page could not be loaded.'} onRetry={reset} />;
}
