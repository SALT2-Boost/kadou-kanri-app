import { Chip } from '@mui/material';

const statusConfig: Record<string, { color: 'success' | 'warning' | 'default' }> = {
  確定: { color: 'success' },
  提案済: { color: 'warning' },
  提案予定: { color: 'default' },
};

interface StatusChipProps {
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  const config = statusConfig[status] ?? { color: 'default' as const };
  return <Chip label={status} color={config.color} size="small" variant="outlined" />;
}
