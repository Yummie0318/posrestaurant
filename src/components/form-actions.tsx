'use client';

import { LoaderCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';

type PendingButtonProps = React.ComponentProps<typeof Button> & { pendingText?: string };

export function SubmitButton({ children, pendingText = 'Saving...', disabled, ...props }: PendingButtonProps) {
  const { pending } = useFormStatus();
  return <Button disabled={disabled || pending} {...props}>{pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />{pendingText}</> : children}</Button>;
}

export function PendingIconButton({ children, pendingLabel = 'Working...', disabled, ...props }: PendingButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <Button disabled={disabled || pending} aria-label={pending ? pendingLabel : props['aria-label']} {...props}>{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : children}</Button>;
}
