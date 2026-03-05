import { useState, useCallback, memo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import SkillChip from '@/shared/ui/SkillChip';
import ScheduleCellComponent from './ScheduleCell';
import AssignmentPopover from './AssignmentPopover';
import type { ScheduleRow, ScheduleCell } from '../types';

interface ScheduleTableProps {
  rows: ScheduleRow[];
  months: string[];
}

const CATEGORY_ORDER: Array<'社員' | '入社予定' | 'インターン'> = ['社員', '入社予定', 'インターン'];

function formatMonth(month: string): string {
  return month.slice(0, 7).replace('-', '/');
}

export default function ScheduleTable({ rows, months }: ScheduleTableProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedCell, setSelectedCell] = useState<ScheduleCell | null>(null);

  const handleCellClick = useCallback((event: React.MouseEvent<HTMLTableCellElement>, cell: ScheduleCell) => {
    setAnchorEl(event.currentTarget);
    setSelectedCell(cell);
  }, []);

  const handlePopoverClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedCell(null);
  }, []);

  // 区分でグルーピング
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    members: rows.filter((r) => r.category === category),
  })).filter((g) => g.members.length > 0);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <TableContainer>
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120, position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }}>
                メンバー名
              </TableCell>
              <TableCell sx={{ minWidth: 150, position: 'sticky', left: 120, zIndex: 3, bgcolor: 'background.paper' }}>
                スキル
              </TableCell>
              {months.map((month) => (
                <TableCell key={month} align="center" sx={{ minWidth: 70 }}>
                  {formatMonth(month)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {grouped.map((group) => (
              <GroupRows
                key={group.category}
                category={group.category}
                members={group.members}
                months={months}
                onCellClick={handleCellClick}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AssignmentPopover
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        assignments={selectedCell?.assignments ?? []}
      />
    </Box>
  );
}

interface GroupRowsProps {
  category: string;
  members: ScheduleRow[];
  months: string[];
  onCellClick: (event: React.MouseEvent<HTMLTableCellElement>, cell: ScheduleCell) => void;
}

const GroupRows = memo(function GroupRows({ category, members, months, onCellClick }: GroupRowsProps) {
  const totalColumns = months.length + 2;

  return (
    <>
      <TableRow>
        <TableCell
          colSpan={totalColumns}
          sx={{ bgcolor: 'grey.200', fontWeight: 'bold', py: 0.5 }}
        >
          {category}
        </TableCell>
      </TableRow>
      {members.map((row) => (
        <MemberRow key={row.memberId} row={row} months={months} onCellClick={onCellClick} />
      ))}
    </>
  );
});

interface MemberRowProps {
  row: ScheduleRow;
  months: string[];
  onCellClick: (event: React.MouseEvent<HTMLTableCellElement>, cell: ScheduleCell) => void;
}

const MemberRow = memo(function MemberRow({ row, months, onCellClick }: MemberRowProps) {
  const handleCellClick = useCallback(
    (month: string) => (e: React.MouseEvent<HTMLTableCellElement>) => {
      const cell = row.months[month];
      if (cell) onCellClick(e, cell);
    },
    [row.months, onCellClick],
  );

  return (
    <TableRow hover>
      <TableCell
        sx={{
          position: 'sticky',
          left: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {row.memberName}
      </TableCell>
      <TableCell
        sx={{
          position: 'sticky',
          left: 120,
          bgcolor: 'background.paper',
          zIndex: 1,
        }}
      >
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {row.skills.map((skill) => (
            <SkillChip key={skill} name={skill} />
          ))}
        </Stack>
      </TableCell>
      {months.map((month) => (
        <ScheduleCellComponent
          key={month}
          cell={row.months[month]}
          onClick={handleCellClick(month)}
        />
      ))}
    </TableRow>
  );
});
