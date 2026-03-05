import { memo } from 'react';
import { TableCell } from '@mui/material';
import type { ScheduleCell as ScheduleCellType } from '../types';

interface ScheduleCellProps {
  cell: ScheduleCellType | undefined;
  month: string;
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

const ScheduleCellComponent = memo(function ScheduleCellComponent({ cell, month, onClick }: ScheduleCellProps) {
  const totalPercentage = cell?.totalPercentage;
  const hasData = totalPercentage != null && totalPercentage > 0;
  const styles = getCellStyles(totalPercentage);

  return (
    <TableCell
      align="center"
      data-month={month}
      onClick={hasData ? onClick : undefined}
      sx={{
        ...styles,
        cursor: hasData ? 'pointer' : 'default',
        '&:hover': hasData ? { opacity: 0.8 } : {},
        py: 0.5,
        px: 1,
        minWidth: 60,
      }}
    >
      {hasData ? `${totalPercentage}%` : ''}
    </TableCell>
  );
});

export default ScheduleCellComponent;
