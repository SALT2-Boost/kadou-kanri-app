import { useState } from 'react';
import {
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MonthPicker from '@/shared/ui/MonthPicker';
import RoleAutocompleteField from '@/shared/ui/RoleAutocompleteField';
import { useCreateProject, useUpdateProject, useCreateProjectPlaceholders } from '../hooks';
import { useSkills } from '@/features/members/hooks';
import type { Skill } from '@/features/members/types';
import type { Project } from '../types';
import { useProjectCategories, useRoleCandidates } from '@/features/settings/hooks';

const STATUS_OPTIONS = ['確定', '提案済', '提案予定'] as const;

function calcMonthCount(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  const diff = (ey - sy) * 12 + (em - sm) + 1;
  return diff > 0 ? diff : null;
}

function buildPlaceholderName(role: string): string {
  const trimmedRole = role.trim();
  return trimmedRole ? `未定要員(${trimmedRole})` : '未定要員';
}

interface PlaceholderDraft {
  name: string;
  role: string;
  skills: Skill[];
  note: string;
}

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  project?: Project;
}

export default function ProjectForm({ open, onClose, project }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [status, setStatus] = useState<'確定' | '提案済' | '提案予定'>('提案予定');
  const [category, setCategory] = useState<Project['category']>('その他');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [placeholders, setPlaceholders] = useState<PlaceholderDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const createProjectPlaceholders = useCreateProjectPlaceholders();
  const { data: allSkills = [] } = useSkills();
  const { data: categoryMasters = [] } = useProjectCategories();
  const { data: roleCandidates = [] } = useRoleCandidates();

  const isEditMode = !!project;
  const categoryOptions = categoryMasters.length
    ? categoryMasters.map((item) => item.name)
    : [category];
  const roleOptions = roleCandidates.map((candidate) => candidate.name);

  const resetForm = () => {
    if (project) {
      setName(project.name);
      setMonthlyRevenue(project.monthly_revenue != null ? String(project.monthly_revenue) : '');
      setStartMonth(project.start_month.slice(0, 7));
      setEndMonth(project.end_month ? project.end_month.slice(0, 7) : '');
      setStatus(project.status);
      setCategory(project.category);
      setDescription(project.description ?? '');
      setNote(project.note ?? '');
      setPlaceholders([]);
    } else {
      setName('');
      setMonthlyRevenue('');
      setStartMonth('');
      setEndMonth('');
      setStatus('提案予定');
      setCategory('その他');
      setDescription('');
      setNote('');
      setPlaceholders([]);
    }
    setFormError(null);
  };

  const isValid = name.trim() !== '' && startMonth !== '';

  const addPlaceholder = () => {
    setPlaceholders((prev) => [...prev, { name: '', role: '', skills: [], note: '' }]);
  };

  const updatePlaceholder = (index: number, updates: Partial<PlaceholderDraft>) => {
    setPlaceholders((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removePlaceholder = (index: number) => {
    setPlaceholders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEndMonthChange = (value: string) => {
    if (value && startMonth && value < startMonth) return;
    setEndMonth(value);
  };

  const monthCount = calcMonthCount(startMonth, endMonth);

  const handleSave = async () => {
    if (!isValid) return;

    // バリデーション: 未定要員には role / skills 必須
    for (let i = 0; i < placeholders.length; i++) {
      if (!placeholders[i].role.trim()) {
        setFormError(`未定要員 ${i + 1} には role を設定してください。`);
        return;
      }
      if (placeholders[i].skills.length === 0) {
        setFormError(`未定要員 ${i + 1} には最低1つスキルを設定してください。`);
        return;
      }
    }

    setFormError(null);

    const payload = {
      name: name.trim(),
      monthly_revenue: monthlyRevenue ? Number(monthlyRevenue) : null,
      start_month: `${startMonth}-01`,
      end_month: endMonth ? `${endMonth}-01` : null,
      status,
      category,
      staffing_targets: [],
      description: description.trim() || null,
      note: note.trim() || null,
    };

    if (isEditMode) {
      updateProject.mutate({ id: project.id, data: payload }, { onSuccess: () => onClose() });
      return;
    }

    // 新規作成: プロジェクト → 未定要員 → アサイン
    setSaving(true);
    try {
      const created = await createProject.mutateAsync(payload);
      if (placeholders.length > 0) {
        await createProjectPlaceholders.mutateAsync({
          projectId: created.id,
          startMonth: payload.start_month,
          endMonth: payload.end_month,
          placeholders: placeholders.map((ph) => ({
            name: ph.name.trim() || buildPlaceholderName(ph.role),
            role: ph.role.trim(),
            note: ph.note.trim() || null,
            skillIds: ph.skills.map((skill) => skill.id),
          })),
        });
      }

      onClose();
    } catch {
      setFormError('保存に失敗しました。入力内容を確認して再度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionProps={{ onEnter: resetForm }}
    >
      <DialogTitle>{isEditMode ? '案件を編集' : '新規案件'}</DialogTitle>
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
            label="PJカテゴリー"
            select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            fullWidth
          >
            {categoryOptions.map((opt) => (
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

          {/* 未定要員セクション（新規作成時のみ） */}
          {!isEditMode && (
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">未定要員（任意）</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addPlaceholder}>
                  追加
                </Button>
              </Stack>
              {placeholders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  未設定（後からアサイン画面で追加できます）
                </Typography>
              ) : (
                placeholders.map((ph, index) => (
                  <Stack
                    key={index}
                    spacing={1.5}
                    sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight="medium">
                        未定要員 {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removePlaceholder(index)}
                        aria-label={`未定要員 ${index + 1} を削除`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Autocomplete
                      multiple
                      options={allSkills}
                      getOptionLabel={(option) => option.name}
                      value={ph.skills}
                      onChange={(_e, newSkills) => updatePlaceholder(index, { skills: newSkills })}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderTags={(value, getTagProps) =>
                        value.map((option, i) => {
                          const { key, ...tagProps } = getTagProps({ index: i });
                          return <Chip key={key} label={option.name} size="small" {...tagProps} />;
                        })
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="スキル"
                          placeholder="スキルを選択"
                          size="small"
                        />
                      )}
                      noOptionsText="スキルがありません"
                    />
                    <RoleAutocompleteField
                      label="role"
                      value={ph.role}
                      options={roleOptions}
                      onChange={(nextRole) => updatePlaceholder(index, { role: nextRole })}
                      helperText="候補から選択できますが、自由入力も可能です"
                      size="small"
                      required
                    />
                    <TextField
                      label="表示名（任意）"
                      value={ph.name}
                      onChange={(e) => updatePlaceholder(index, { name: e.target.value })}
                      size="small"
                    />
                    <TextField
                      label="補足メモ（任意）"
                      value={ph.note}
                      onChange={(e) => updatePlaceholder(index, { note: e.target.value })}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      表示名: {ph.name.trim() || buildPlaceholderName(ph.role)}
                    </Typography>
                  </Stack>
                ))
              )}
            </Stack>
          )}

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

          {formError && (
            <Typography variant="body2" color="error">
              {formError}
            </Typography>
          )}
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
            !isValid ||
            saving ||
            createProject.isPending ||
            updateProject.isPending ||
            createProjectPlaceholders.isPending
          }
        >
          {isEditMode ? '更新' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
