import { Chip } from '@mui/material';

interface SkillChipProps {
  name: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function SkillChip({ name, selected, onClick }: SkillChipProps) {
  return (
    <Chip
      label={name}
      size="small"
      variant={selected ? 'filled' : 'outlined'}
      color={selected ? 'primary' : 'default'}
      onClick={onClick}
      sx={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}
