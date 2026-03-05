import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import PageHeader from '@/shared/ui/PageHeader';
import PeriodView from './PeriodView';
import MonthlyView from './MonthlyView';

export default function SchedulePage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="稼働表" />

      <Tabs
        value={tabIndex}
        onChange={(_e, newValue: number) => setTabIndex(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="期間ビュー" />
        <Tab label="月別ビュー" />
      </Tabs>

      {tabIndex === 0 && <PeriodView />}
      {tabIndex === 1 && <MonthlyView />}
    </Box>
  );
}
