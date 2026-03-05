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
import { AssignmentTable } from '@/features/assignments';
import { useProject, useUpdateProject, useDeleteProject } from '../hooks';

const STATUS_OPTIONS = ['確定', '提案済', '提案'] as const;

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
  const [status, setStatus] = useState<'確定' | '提案済' | '提案'>('提案');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const startEditing = () => {
    if (!project) return;
    setName(project.name);
    setMonthlyRevenue(
      project.monthly_revenue != null ? String(project.monthly_revenue) : ''
    );
    setStartMonth(project.start_month.slice(0, 7));
    setEndMonth(project.end_month ? project.end_month.slice(0, 7) : '');
    setStatus(project.status);
    setDescription(project.description ?? '');
    setNote(project.note ?? '');
    setEditing(true);
  };

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
          description: description.trim() || null,
          note: note.trim() || null,
        },
      },
      { onSuccess: () => setEditing(false) }
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          color="inherit"
        >
          案件一覧
        </Button>
      </Stack>

      {/* Basic Info */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight="bold">
            基本情報
          </Typography>
          <Stack direction="row" spacing={1}>
            {editing ? (
              <>
                <Button
                  onClick={() => setEditing(false)}
                  color="inherit"
                  size="small"
                >
                  キャンセル
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  size="small"
                  disabled={
                    name.trim() === '' ||
                    startMonth === '' ||
                    updateProject.isPending
                  }
                >
                  保存
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={startEditing}
                  size="small"
                >
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
              label="月額売上（万円）"
              type="number"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="開始月"
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="終了月"
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TextField
              label="ステータス"
              select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as '確定' | '提案済' | '提案')
              }
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
                  {project.end_month
                    ? project.end_month.slice(0, 7).replace('-', '/')
                    : ''}
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
                <Typography whiteSpace="pre-wrap">
                  {project.description}
                </Typography>
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

      {/* Assignments */}
      <AssignmentTable
        projectId={project.id}
        startMonth={project.start_month}
        endMonth={project.end_month}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
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
