import type { MouseEvent } from 'react';
import { Link as RouterLink, type To } from 'react-router-dom';
import { Link, type LinkProps } from '@mui/material';
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges';

type GuardedLinkProps = Omit<LinkProps<typeof RouterLink>, 'href' | 'to' | 'component'> & {
  to: To;
};

export default function GuardedLink({ to, onClick, ...props }: GuardedLinkProps) {
  const { confirmIfNeeded } = useUnsavedChanges();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (!confirmIfNeeded()) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return <Link component={RouterLink} to={to} onClick={handleClick} {...props} />;
}
