import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
} from '@mui/material';
import { useOverloadAlerts } from '../hooks';

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  return `${year}/${m}`;
}

export default function OverloadAlertList() {
  const { data, isLoading } = useOverloadAlerts();

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        過負荷アラート（100%超）
      </Typography>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !data || data.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          アラートなし
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>メンバー名</TableCell>
                <TableCell>月</TableCell>
                <TableCell align="right">合計稼働%</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={`${row.memberName}-${row.month}`}>
                  <TableCell>{row.memberName}</TableCell>
                  <TableCell>{formatMonth(row.month)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                    {row.totalPercentage}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
