import { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from '@mui/material';
import { useMonthlyView, useAllSkills } from '../hooks';
import { useDebounce } from '@/shared/hooks/useDebounce';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import MonthPicker from '@/shared/ui/MonthPicker';
import SkillChip from '@/shared/ui/SkillChip';
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';
import ScheduleFilter from './ScheduleFilter';
import type { MonthlyViewRow } from '../types';
import { filterScheduleRows } from '../transforms';

function getCurrentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

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

  // 区分でグルーピング
  const grouped = useMemo(
    () =>
      MEMBER_CATEGORIES.map((category) => ({
        category,
        members: filteredRows.filter((r) => r.category === category),
      })).filter((g) => g.members.length > 0),
    [filteredRows],
  );

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

      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer>
          <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    minWidth: 120,
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    bgcolor: 'background.paper',
                  }}
                >
                  メンバー名
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 110,
                    position: 'sticky',
                    left: 120,
                    zIndex: 3,
                    bgcolor: 'background.paper',
                  }}
                >
                  role
                </TableCell>
                <TableCell
                  sx={{
                    minWidth: 150,
                    position: 'sticky',
                    left: 230,
                    zIndex: 3,
                    bgcolor: 'background.paper',
                  }}
                >
                  スキル
                </TableCell>
                {projects.map((project) => (
                  <TableCell key={project.id} align="center" sx={{ minWidth: 100 }}>
                    {project.name}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ minWidth: 70, fontWeight: 'bold' }}>
                  合計
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grouped.map((group) => (
                <MonthlyGroupRows
                  key={group.category}
                  category={group.category}
                  members={group.members}
                  projects={projects}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

interface MonthlyGroupRowsProps {
  category: string;
  members: MonthlyViewRow[];
  projects: Array<{ id: string; name: string }>;
}

function MonthlyGroupRows({ category, members, projects }: MonthlyGroupRowsProps) {
  const totalColumns = projects.length + 4; // name + role + skills + projects + total

  return (
    <>
      <TableRow>
        <TableCell colSpan={totalColumns} sx={{ bgcolor: 'grey.200', fontWeight: 'bold', py: 0.5 }}>
          {category}
        </TableCell>
      </TableRow>
      {members.map((row) => (
        <TableRow key={row.rowId} hover>
          <TableCell
            sx={{
              position: 'sticky',
              left: 0,
              bgcolor: 'background.paper',
              zIndex: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {row.memberName}
          </TableCell>
          <TableCell
            sx={{
              position: 'sticky',
              left: 120,
              bgcolor: 'background.paper',
              zIndex: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {row.role}
          </TableCell>
          <TableCell
            sx={{
              position: 'sticky',
              left: 230,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {row.skills.map((skill) => (
                <SkillChip key={skill} name={skill} />
              ))}
            </Stack>
          </TableCell>
          {projects.map((project) => {
            const pct = row.projects[project.id];
            return (
              <TableCell key={project.id} align="center" sx={{ py: 0.5 }}>
                {pct && pct > 0 ? `${pct}%` : ''}
              </TableCell>
            );
          })}
          <TableCell align="center" sx={{ py: 0.5 }}>
            <Typography
              variant="body2"
              fontWeight={row.totalPercentage > 100 ? 'bold' : 'normal'}
              color={row.totalPercentage > 100 ? 'error' : 'text.primary'}
            >
              {row.totalPercentage > 0 ? `${row.totalPercentage}%` : ''}
            </Typography>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
