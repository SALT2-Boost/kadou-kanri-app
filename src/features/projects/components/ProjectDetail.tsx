import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import MonthPicker from '@/shared/ui/MonthPicker';
import { AssignmentTable } from '@/features/assignments';
import { useProject, useUpdateProject, useDeleteProject } from '../hooks';
import { PROJECT_CATEGORIES } from '@/shared/constants/categories';
import type { ProjectCategory } from '@/shared/constants/categories';

const STATUS_OPTIONS = ['確定', '提案済', '提案予定'] as const;

function calcMonthCount(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  const diff = (ey - sy) * 12 + (em - sm) + 1;
  return diff > 0 ? diff : null;
}

function formatMonthCount(start: string, end: string | null): string {
  if (!end) return '';
  const count = calcMonthCount(start.slice(0, 7), end.slice(0, 7));
  return count ? `（${count}ヶ月）` : '';
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [status, setStatus] = useState<'確定' | '提案済' | '提案予定'>('提案予定');
  const [category, setCategory] = useState<ProjectCategory>('その他');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const startEditing = () => {
    if (!project) return;
    setName(project.name);
    setMonthlyRevenue(project.monthly_revenue != null ? String(project.monthly_revenue) : '');
    setStartMonth(project.start_month.slice(0, 7));
    setEndMonth(project.end_month ? project.end_month.slice(0, 7) : '');
    setStatus(project.status);
    setCategory(project.category);
    setDescription(project.description ?? '');
    setNote(project.note ?? '');
    setEditing(true);
  };

  const handleEndMonthChange = (value: string) => {
    if (value && startMonth && value < startMonth) return;
    setEndMonth(value);
  };

  const monthCount = calcMonthCount(startMonth, endMonth);

  const handleSave = () => {
    if (!id || name.trim() === '' || startMonth === '') return;

    updateProject.mutate(
      {
        id,
        data: {
          name: name.trim(),
          monthly_revenue: monthlyRevenue ? Number(monthlyRevenue) : null,
          start_month: `${startMonth}-01`,
          end_month: endMonth ? `${endMonth}-01` : null,
          status,
          category,
          description: description.trim() || null,
          note: note.trim() || null,
        },
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    if (!id) return;
    deleteProjectMutation.mutate(id, {
      onSuccess: () => navigate('/projects'),
    });
  };

  if (isLoading) return <LoadingOverlay />;

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">案件が見つかりません</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} color="inherit">
          案件一覧
        </Button>
      </Stack>

      {/* Basic Info */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            基本情報
          </Typography>
          <Stack direction="row" spacing={1}>
            {editing ? (
              <>
                <Button onClick={() => setEditing(false)} color="inherit" size="small">
                  キャンセル
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  size="small"
                  disabled={name.trim() === '' || startMonth === '' || updateProject.isPending}
                >
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button variant="outlined" onClick={startEditing} size="small">
                  編集
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  size="small"
                >
                  削除
                </Button>
              </>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {editing ? (
          <Stack spacing={2}>
            <TextField
              label="案件名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="PJカテゴリー"
              select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              fullWidth
            >
              {PROJECT_CATEGORIES.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="月額売上（万円）"
              type="number"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2} alignItems="center">
              <MonthPicker
                label="開始月"
                value={startMonth}
                onChange={setStartMonth}
                required
                fullWidth
              />
              <MonthPicker
                label="終了月"
                value={endMonth}
                onChange={handleEndMonthChange}
                fullWidth
                minMonth={startMonth || undefined}
              />
              {monthCount && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: 'nowrap', minWidth: 60 }}
                >
                  {monthCount}ヶ月
                </Typography>
              )}
            </Stack>
            <TextField
              label="ステータス"
              select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              fullWidth
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="概要"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="備考"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="h5" fontWeight="bold">
              {project.name}
            </Typography>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  カテゴリー
                </Typography>
                <Typography>{project.category}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  月額売上
                </Typography>
                <Typography>
                  {project.monthly_revenue != null
                    ? `${project.monthly_revenue.toLocaleString()}万円`
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  期間
                </Typography>
                <Typography>
                  {project.start_month.slice(0, 7).replace('-', '/')}
                  {' - '}
                  {project.end_month ? project.end_month.slice(0, 7).replace('-', '/') : ''}{' '}
                  {formatMonthCount(project.start_month, project.end_month)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  ステータス
                </Typography>
                <Typography>{project.status}</Typography>
              </Box>
            </Stack>
            {project.description && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  概要
                </Typography>
                <Typography whiteSpace="pre-wrap">{project.description}</Typography>
              </Box>
            )}
            {project.note && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  備考
                </Typography>
                <Typography whiteSpace="pre-wrap">{project.note}</Typography>
              </Box>
            )}
          </Stack>
        )}
      </Paper>

      {/* Assignments（未定要員もここに表示される） */}
      <AssignmentTable
        projectId={project.id}
        startMonth={project.start_month}
        endMonth={project.end_month}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>案件を削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{project.name}」を削除しますか？この操作は取り消せません。
            関連するアサインデータもすべて削除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            キャンセル
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteProjectMutation.isPending}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
