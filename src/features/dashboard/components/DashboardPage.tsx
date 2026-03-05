import { Box, Stack } from '@mui/material';
import PageHeader from '@/shared/ui/PageHeader';
import RevenueChart from './RevenueChart';
import OverloadAlertList from './OverloadAlertList';
import UnassignedMemberList from './UnassignedMemberList';

export default function DashboardPage() {
  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="ダッシュボード" />
      <Stack spacing={3}>
        <RevenueChart />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ flex: 1 }}>
            <OverloadAlertList />
          </Box>
          <Box sx={{ flex: 1 }}>
            <UnassignedMemberList />
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
