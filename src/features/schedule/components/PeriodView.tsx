import { useState, useMemo } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { usePeriodView } from '../hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import ScheduleFilter from './ScheduleFilter';
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';
import ScheduleTable from './ScheduleTable';
import { useAllSkills } from '../hooks';
import { filterScheduleRows } from '../transforms';
import { buildMonthStartRange, getCurrentMonthStart } from '@/shared/lib/months';

export default function PeriodView() {
  const [rangeType, setRangeType] = useState<'6' | '12'>('6');
  const [categories, setCategories] = useState<string[]>([...MEMBER_CATEGORIES]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [onlyUnconfirmed, setOnlyUnconfirmed] = useState(false);
  const debouncedSearch = useDebounce(searchText, 300);

  const currentMonth = useMemo(() => getCurrentMonthStart(), []);
  const monthCount = rangeType === '6' ? 6 : 12;
  const months = useMemo(
    () => buildMonthStartRange(currentMonth, monthCount),
    [currentMonth, monthCount],
  );

  const startMonth = months[0];
  const endMonth = months[months.length - 1];

  const { data, isLoading } = usePeriodView(startMonth, endMonth);
  const { data: skills = [] } = useAllSkills();
  const rows = data?.rows;

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return filterScheduleRows(rows, {
      categories,
      selectedSkills,
      searchText: debouncedSearch,
      onlyUnconfirmed,
    });
  }, [rows, categories, debouncedSearch, selectedSkills, onlyUnconfirmed]);

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
        onlyUnconfirmed={onlyUnconfirmed}
        onOnlyUnconfirmedChange={setOnlyUnconfirmed}
        skills={skills}
      />

      <ScheduleTable rows={filteredRows} months={months} />
    </Box>
  );
}
