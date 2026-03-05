import { TableCell } from '@mui/material';
import type { ScheduleCell as ScheduleCellType } from '../types';

interface ScheduleCellProps {
  cell: ScheduleCellType | undefined;
  onClick: (event: React.MouseEvent<HTMLTableCellElement>) => void;
}

function getCellStyles(totalPercentage: number | undefined) {
  if (!totalPercentage || totalPercentage === 0) {
    return {};
  }
  if (totalPercentage > 100) {
    return { bgcolor: 'error.light', fontWeight: 'bold' };
  }
  if (totalPercentage >= 80) {
    return { bgcolor: 'grey.100' };
  }
  return { bgcolor: 'grey.50' };
}

export default function ScheduleCellComponent({ cell, onClick }: ScheduleCellProps) {
  const totalPercentage = cell?.totalPercentage;
  const styles = getCellStyles(totalPercentage);

  return (
    <TableCell
      align="center"
      onClick={cell && cell.totalPercentage > 0 ? onClick : undefined}
      sx={{
        ...styles,
        cursor: cell && cell.totalPercentage > 0 ? 'pointer' : 'default',
        '&:hover': cell && cell.totalPercentage > 0 ? { opacity: 0.8 } : {},
        py: 0.5,
        px: 1,
        minWidth: 60,
      }}
    >
      {totalPercentage && totalPercentage > 0 ? `${totalPercentage}%` : ''}
    </TableCell>
  );
}
