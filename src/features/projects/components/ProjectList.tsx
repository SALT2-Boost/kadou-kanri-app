import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StatusChip from '@/shared/ui/StatusChip';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import { useProjects } from '../hooks';
import ProjectForm from './ProjectForm';

const STATUS_FILTERS = ['確定', '提案済', '提案'] as const;

function formatRevenue(value: number | null): string {
  if (value == null) return '-';
  return `${value.toLocaleString()}万円`;
}

function formatPeriod(start: string, end: string | null): string {
  const s = start.slice(0, 7).replace('-', '/');
  const e = end ? end.slice(0, 7).replace('-', '/') : '';
  return e ? `${s} - ${e}` : `${s} -`;
}

function truncate(text: string | null, max: number): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function ProjectList() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(
    new Set(STATUS_FILTERS)
  );
  const [formOpen, setFormOpen] = useState(false);

  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => activeStatuses.has(p.status));
  }, [projects, activeStatuses]);

  if (isLoading) return <LoadingOverlay />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight="bold">
          案件一覧
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          新規案件
        </Button>
      </Stack>

      {/* Status Filters */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {STATUS_FILTERS.map((status) => (
          <Chip
            key={status}
            label={status}
            variant={activeStatuses.has(status) ? 'filled' : 'outlined'}
            color={activeStatuses.has(status) ? 'primary' : 'default'}
            onClick={() => toggleStatus(status)}
          />
        ))}
      </Stack>

      {/* Projects Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>案件名</TableCell>
              <TableCell align="right">月額売上</TableCell>
              <TableCell>期間</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>概要</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    案件がありません
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow
                  key={project.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <TableCell>
                    <Typography fontWeight="medium">
                      {project.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatRevenue(project.monthly_revenue)}
                  </TableCell>
                  <TableCell>
                    {formatPeriod(project.start_month, project.end_month)}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={project.status} />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ maxWidth: 300 }}
                    >
                      {truncate(project.description, 50)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Form Dialog */}
      <ProjectForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
