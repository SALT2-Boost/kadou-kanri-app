import { useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { useMonthlyView, useAllSkills } from '../hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import MonthPicker from '@/shared/ui/MonthPicker';
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';
import ScheduleFilter from './ScheduleFilter';
import { filterScheduleRows } from '../transforms';
import { getCurrentMonthValue } from '@/shared/lib/months';
import MonthlyScheduleTable from './MonthlyScheduleTable';

export default function MonthlyView() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue);
  const [categories, setCategories] = useState<string[]>([...MEMBER_CATEGORIES]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [onlyUnconfirmed, setOnlyUnconfirmed] = useState(false);
  const debouncedSearch = useDebounce(searchText, 300);

  const monthParam = `${selectedMonth}-01`;

  const { data, isLoading } = useMonthlyView(monthParam);
  const { data: skills = [] } = useAllSkills();

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return filterScheduleRows(data.rows, {
      categories,
      selectedSkills,
      searchText: debouncedSearch,
      onlyUnconfirmed,
    });
  }, [data, categories, debouncedSearch, onlyUnconfirmed, selectedSkills]);

  const projects = data?.projects ?? [];

  if (isLoading) return <LoadingOverlay />;

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <MonthPicker label="対象月" value={selectedMonth} onChange={setSelectedMonth} />
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

      <MonthlyScheduleTable rows={filteredRows} projects={projects} />
    </Box>
  );
}
