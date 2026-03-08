import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMonthlyRevenue } from '../hooks';

function formatMonth(month: string): string {
  // "2026-03-01" -> "2026/03"
  const [year, m] = month.split('-');
  return `${year}/${m}`;
}

function formatRevenue(value: number) {
  return `${value.toLocaleString('ja-JP')}万円`;
}

export default function RevenueChart() {
  const { data, isLoading } = useMonthlyRevenue();

  const chartData = (data ?? []).map((row) => ({
    month: formatMonth(row.month),
    確定: row.confirmed,
    提案済: row.proposed,
    提案予定: row.draft,
  }));

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        月別売上推移
      </Typography>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : chartData.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          データがありません
        </Typography>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 16, right: 24, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis width={72} tickFormatter={(value) => `${value}`} unit="万円" />
            <Tooltip formatter={(value) => formatRevenue(Number(value) || 0)} />
            <Legend />
            <Bar dataKey="確定" stackId="revenue" fill="#4caf50" />
            <Bar dataKey="提案済" stackId="revenue" fill="#ff9800" />
            <Bar dataKey="提案予定" stackId="revenue" fill="#9e9e9e" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
