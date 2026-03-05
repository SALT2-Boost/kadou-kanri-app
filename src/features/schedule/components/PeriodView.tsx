import { useState, useMemo } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useMemberSchedule, useAllSkills } from '../hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import ScheduleFilter from './ScheduleFilter';
import ScheduleTable from './ScheduleTable';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function generateMonthRange(startMonth: string, count: number): string[] {
  const months: string[] = [];
  const start = new Date(startMonth + '-01');
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}-01`);
  }
  return months;
}

export default function PeriodView() {
  const [rangeType, setRangeType] = useState<'6' | '12'>('6');
  const [categories, setCategories] = useState<string[]>(['社員', '入社予定', 'インターン']);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const monthCount = rangeType === '6' ? 6 : 12;
  const months = useMemo(
    () => generateMonthRange(currentMonth, monthCount),
    [currentMonth, monthCount]
  );

  const startMonth = months[0];
  const endMonth = months[months.length - 1];

  const { data: rows, isLoading } = useMemberSchedule(startMonth, endMonth);
  const { data: skills = [] } = useAllSkills();

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((row) => {
      if (!categories.includes(row.category)) return false;
      if (debouncedSearch && !row.memberName.includes(debouncedSearch)) return false;
      if (
        selectedSkills.length > 0 &&
        !selectedSkills.some((s) => row.skills.includes(s))
      ) {
        return false;
      }
      return true;
    });
  }, [rows, categories, debouncedSearch, selectedSkills]);

  const handleRangeChange = (event: SelectChangeEvent) => {
    setRangeType(event.target.value as '6' | '12');
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>表示期間</InputLabel>
          <Select value={rangeType} label="表示期間" onChange={handleRangeChange}>
            <MenuItem value="6">半年</MenuItem>
            <MenuItem value="12">1年</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <ScheduleFilter
        categories={categories}
        onCategoriesChange={setCategories}
        selectedSkills={selectedSkills}
        onSkillsChange={setSelectedSkills}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        skills={skills}
      />

      <ScheduleTable rows={filteredRows} months={months} />
    </Box>
  );
}
