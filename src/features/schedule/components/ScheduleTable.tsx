import { useState, useCallback, useMemo, memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Link,
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

const NAME_COLUMN_WIDTH = 220;
const SKILLS_COLUMN_WIDTH = 260;
const FIXED_COLUMNS_WIDTH = NAME_COLUMN_WIDTH + SKILLS_COLUMN_WIDTH;

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
                  width: NAME_COLUMN_WIDTH,
                  minWidth: NAME_COLUMN_WIDTH,
                  maxWidth: NAME_COLUMN_WIDTH,
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  bgcolor: 'background.paper',
                  borderRight: '1px solid',
                  borderRightColor: 'divider',
                }}
              >
                メンバー名
              </TableCell>
              <TableCell
                sx={{
                  width: SKILLS_COLUMN_WIDTH,
                  minWidth: SKILLS_COLUMN_WIDTH,
                  maxWidth: SKILLS_COLUMN_WIDTH,
                  position: 'sticky',
                  left: NAME_COLUMN_WIDTH,
                  zIndex: 3,
                  bgcolor: 'background.paper',
                  borderRight: '2px solid',
                  borderRightColor: 'divider',
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
  const scrollingColumns = months.length;

  return (
    <>
      <TableRow>
        <TableCell
          colSpan={2}
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: 2,
            width: FIXED_COLUMNS_WIDTH,
            minWidth: FIXED_COLUMNS_WIDTH,
            maxWidth: FIXED_COLUMNS_WIDTH,
            bgcolor: 'grey.200',
            fontWeight: 'bold',
            py: 0.5,
            borderRight: '2px solid',
            borderRightColor: 'divider',
          }}
        >
          {category}
        </TableCell>
        <TableCell colSpan={scrollingColumns} sx={{ bgcolor: 'grey.200', py: 0.5 }} />
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
          width: NAME_COLUMN_WIDTH,
          minWidth: NAME_COLUMN_WIDTH,
          maxWidth: NAME_COLUMN_WIDTH,
          whiteSpace: 'nowrap',
          fontStyle: isPlaceholder ? 'italic' : 'normal',
          color: isPlaceholder ? 'text.secondary' : 'text.primary',
          borderRight: '1px solid',
          borderRightColor: 'divider',
        }}
      >
        {row.memberId ? (
          <Link
            component={RouterLink}
            to={`/members/${row.memberId}`}
            underline="hover"
            color="inherit"
            fontWeight={500}
          >
            {row.memberName}
          </Link>
        ) : (
          row.memberName
        )}
      </TableCell>
      <TableCell
        sx={{
          position: 'sticky',
          left: NAME_COLUMN_WIDTH,
          bgcolor: isPlaceholder ? 'rgba(255, 152, 0, 0.06)' : 'background.paper',
          zIndex: 1,
          width: SKILLS_COLUMN_WIDTH,
          minWidth: SKILLS_COLUMN_WIDTH,
          maxWidth: SKILLS_COLUMN_WIDTH,
          borderRight: '2px solid',
          borderRightColor: 'divider',
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
