import { useState, useCallback, useMemo, memo } from 'react';
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
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';
import type { ScheduleRow, ScheduleCell } from '../types';

interface ScheduleTableProps {
  rows: ScheduleRow[];
  months: string[];
}

function formatMonth(month: string): string {
  return month.slice(0, 7).replace('-', '/');
}

export default function ScheduleTable({ rows, months }: ScheduleTableProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedCell, setSelectedCell] = useState<ScheduleCell | null>(null);

  const handleCellClick = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>, cell: ScheduleCell) => {
      setAnchorEl(event.currentTarget);
      setSelectedCell(cell);
    },
    [],
  );

  const handlePopoverClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedCell(null);
  }, []);

  // 区分ごとに1パスでグルーピング（rows数が多い時の再描画コストを抑える）
  const grouped = useMemo(() => {
    const groupedMap = new Map<string, ScheduleRow[]>();
    for (const category of MEMBER_CATEGORIES) {
      groupedMap.set(category, []);
    }
    for (const row of rows) {
      const bucket = groupedMap.get(row.category);
      if (bucket) {
        bucket.push(row);
      }
    }
    return MEMBER_CATEGORIES.map((category) => ({
      category,
      members: groupedMap.get(category) ?? [],
    })).filter((group) => group.members.length > 0);
  }, [rows]);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <TableContainer>
        <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  minWidth: 120,
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  bgcolor: 'background.paper',
                }}
              >
                メンバー名
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 110,
                  position: 'sticky',
                  left: 120,
                  zIndex: 3,
                  bgcolor: 'background.paper',
                }}
              >
                role
              </TableCell>
              <TableCell
                sx={{
                  minWidth: 160,
                  position: 'sticky',
                  left: 230,
                  zIndex: 3,
                  bgcolor: 'background.paper',
                }}
              >
                スキル
              </TableCell>
              {months.map((month, index) => (
                <TableCell
                  key={month}
                  align="center"
                  sx={{
                    minWidth: 70,
                    borderLeft: '1px solid',
                    borderLeftColor: 'divider',
                    borderRight: index === months.length - 1 ? '1px solid' : undefined,
                    borderRightColor: index === months.length - 1 ? 'divider' : undefined,
                  }}
                >
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

const GroupRows = memo(function GroupRows({
  category,
  members,
  months,
  onCellClick,
}: GroupRowsProps) {
  const totalColumns = months.length + 2;
  const adjustedColumns = totalColumns + 1;

  return (
    <>
      <TableRow>
        <TableCell
          colSpan={adjustedColumns}
          sx={{ bgcolor: 'grey.200', fontWeight: 'bold', py: 0.5 }}
        >
          {category}
        </TableCell>
      </TableRow>
      {members.map((row) => (
        <MemberRow key={row.rowId} row={row} months={months} onCellClick={onCellClick} />
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
  const isPlaceholder = row.category === '未定枠';

  const handleCellClick = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement>) => {
      const month = (e.currentTarget as HTMLElement).dataset.month;
      if (!month) return;
      const cell = row.months[month];
      if (cell) onCellClick(e, cell);
    },
    [row.months, onCellClick],
  );

  return (
    <TableRow
      hover
      sx={
        isPlaceholder
          ? {
              borderLeft: '3px dashed',
              borderLeftColor: 'warning.main',
              bgcolor: 'rgba(255, 152, 0, 0.04)',
            }
          : undefined
      }
    >
      <TableCell
        sx={{
          position: 'sticky',
          left: 0,
          bgcolor: isPlaceholder ? 'rgba(255, 152, 0, 0.06)' : 'background.paper',
          zIndex: 1,
          whiteSpace: 'nowrap',
          fontStyle: isPlaceholder ? 'italic' : 'normal',
          color: isPlaceholder ? 'text.secondary' : 'text.primary',
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
          whiteSpace: 'nowrap',
        }}
      >
        {row.role}
      </TableCell>
      <TableCell
        sx={{
          position: 'sticky',
          left: 230,
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
      {months.map((month, index) => (
        <ScheduleCellComponent
          key={month}
          cell={row.months[month]}
          month={month}
          isLastMonth={index === months.length - 1}
          onClick={handleCellClick}
        />
      ))}
    </TableRow>
  );
});
