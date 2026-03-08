import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import GuardedLink from '@/shared/ui/GuardedLink';
import type { MemberScheduleRow } from '../types';

interface MemberUpcomingScheduleTableProps {
  months: string[];
  rows: MemberScheduleRow[];
}

function formatMonth(month: string): string {
  return month.slice(0, 7).replace('-', '/');
}

function formatPercentage(value: number): string {
  return value > 0 ? `${value}%` : '';
}

export default function MemberUpcomingScheduleTable({
  months,
  rows,
}: MemberUpcomingScheduleTableProps) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ overflowX: 'auto', maxWidth: '100%' }}
    >
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 220, fontWeight: 'bold' }}>案件</TableCell>
            {months.map((month) => (
              <TableCell
                key={month}
                align="center"
                sx={{ minWidth: 96, fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {formatMonth(month)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={months.length + 1} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">今後6ヶ月の稼働予定はありません</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.projectId} hover>
                <TableCell>
                  <GuardedLink
                    to={`/projects/${row.projectId}`}
                    underline="hover"
                    color="inherit"
                    fontWeight={500}
                  >
                    {row.projectName}
                  </GuardedLink>
                </TableCell>
                {months.map((month) => (
                  <TableCell key={month} align="center">
                    {formatPercentage(row.months[month] ?? 0)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
