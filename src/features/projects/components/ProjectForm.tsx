import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import { useCreateProject, useUpdateProject } from '../hooks';
import type { Project } from '../types';

const STATUS_OPTIONS = ['確定', '提案済', '提案'] as const;

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  project?: Project;
}

export default function ProjectForm({
  open,
  onClose,
  project,
}: ProjectFormProps) {
  const [name, setName] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [status, setStatus] = useState<'確定' | '提案済' | '提案'>('提案');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  useEffect(() => {
    if (project) {
      setName(project.name);
      setMonthlyRevenue(
        project.monthly_revenue != null ? String(project.monthly_revenue) : ''
      );
      setStartMonth(project.start_month.slice(0, 7));
      setEndMonth(project.end_month ? project.end_month.slice(0, 7) : '');
      setStatus(project.status);
      setDescription(project.description ?? '');
      setNote(project.note ?? '');
    } else {
      setName('');
      setMonthlyRevenue('');
      setStartMonth('');
      setEndMonth('');
      setStatus('提案');
      setDescription('');
      setNote('');
    }
  }, [project, open]);

  const isValid = name.trim() !== '' && startMonth !== '';

  const handleSave = () => {
    if (!isValid) return;

    const payload = {
      name: name.trim(),
      monthly_revenue: monthlyRevenue ? Number(monthlyRevenue) : null,
      start_month: `${startMonth}-01`,
      end_month: endMonth ? `${endMonth}-01` : null,
      status,
      description: description.trim() || null,
      note: note.trim() || null,
    };

    if (project) {
      updateProject.mutate(
        { id: project.id, data: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createProject.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{project ? '案件を編集' : '新規案件'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="案件名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            error={name.trim() === '' && name !== ''}
          />
          <TextField
            label="月額売上（万円）"
            type="number"
            value={monthlyRevenue}
            onChange={(e) => setMonthlyRevenue(e.target.value)}
            fullWidth
          />
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={
            !isValid || createProject.isPending || updateProject.isPending
          }
        >
          {project ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
