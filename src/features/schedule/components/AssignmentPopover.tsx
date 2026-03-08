import { Link as RouterLink } from 'react-router-dom';
import {
  Link,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

interface AssignmentPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  assignments: Array<{ projectId: string; projectName: string; percentage: number }>;
}

export default function AssignmentPopover({
  anchorEl,
  onClose,
  assignments,
}: AssignmentPopoverProps) {
  const total = assignments.reduce((sum, a) => sum + a.percentage, 0);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Table size="small" sx={{ minWidth: 240 }}>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2">案件名</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2">稼働%</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((a, i) => (
            <TableRow key={i}>
              <TableCell>
                <Link
                  component={RouterLink}
                  to={`/projects/${a.projectId}`}
                  underline="hover"
                  color="inherit"
                >
                  {a.projectName}
                </Link>
              </TableCell>
              <TableCell align="right">{a.percentage}%</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>
              <Typography variant="subtitle2">合計</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" color={total > 100 ? 'error' : 'text.primary'}>
                {total}%
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Popover>
  );
}
