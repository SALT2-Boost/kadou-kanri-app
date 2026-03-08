import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Chip,
  Button,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PageHeader from '@/shared/ui/PageHeader';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import {
  useMember,
  useSkills,
  useUpdateMember,
  useUpdateMemberSkills,
  useDeleteMember,
} from '../hooks';
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';
import type { MemberCategory } from '@/shared/constants/categories';
import type { Skill } from '../types';

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: member, isLoading } = useMember(id!);
  const { data: skills = [] } = useSkills();
  const updateMemberMutation = useUpdateMember();
  const updateMemberSkills = useUpdateMemberSkills();
  const deleteMemberMutation = useDeleteMember();

  const [draft, setDraft] = useState<{
    name: string;
    category: MemberCategory;
    selectedSkills: Skill[];
    note: string;
    joinDate: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSave = async () => {
    if (!form || !form.name.trim() || !id) return;

    try {
      await updateMemberMutation.mutateAsync({
        id,
        input: {
          name: form.name.trim(),
          category: form.category,
          note: form.note.trim() || null,
          join_date: form.category === '入社予定' && form.joinDate ? form.joinDate : null,
        },
      });
      await updateMemberSkills.mutateAsync({
        memberId: id,
        skillIds: form.selectedSkills.map((skill) => skill.id),
      });
    } catch {
      // エラーは TanStack Query が管理
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMemberMutation.mutateAsync(id);
      navigate('/members');
    } catch {
      // エラーは TanStack Query が管理
    }
  };

  if (isLoading || !member) return <LoadingOverlay />;

  const form =
    draft ??
    ({
      name: member.name,
      category: member.category,
      selectedSkills: member.member_skills.map((ms) => ms.skills),
      note: member.note ?? '',
      joinDate: member.join_date ?? '',
    } satisfies {
      name: string;
      category: MemberCategory;
      selectedSkills: Skill[];
      note: string;
      joinDate: string;
    });

  const updateDraft = (
    updates: Partial<{
      name: string;
      category: MemberCategory;
      selectedSkills: Skill[];
      note: string;
      joinDate: string;
    }>,
  ) => {
    setDraft({
      ...form,
      ...updates,
    });
  };

  const isSaving = updateMemberMutation.isPending || updateMemberSkills.isPending;

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/members')}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        メンバー一覧に戻る
      </Button>

      <PageHeader
        title="メンバー詳細"
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              削除
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving || !form.name.trim()}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </Stack>
        }
      />

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="名前"
            value={form.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            required
            fullWidth
            error={!form.name.trim()}
            helperText={!form.name.trim() ? '名前は必須です' : ''}
          />

          <FormControl fullWidth>
            <InputLabel>区分</InputLabel>
            <Select
              value={form.category}
              label="区分"
              onChange={(e) => updateDraft({ category: e.target.value as MemberCategory })}
            >
              {MEMBER_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={skills}
            getOptionLabel={(option) => option.name}
            value={form.selectedSkills}
            onChange={(_e, newValue) => updateDraft({ selectedSkills: newValue })}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option.name} size="small" {...tagProps} />;
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="スキル" placeholder="スキルを選択" />
            )}
          />

          {form.category === '入社予定' && (
            <TextField
              label="入社予定時期"
              type="date"
              value={form.joinDate}
              onChange={(e) => updateDraft({ joinDate: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}

          <TextField
            label="備考"
            value={form.note}
            onChange={(e) => updateDraft({ note: e.target.value })}
            multiline
            minRows={3}
            maxRows={10}
            fullWidth
          />

          <Stack direction="row" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              作成日: {new Date(member.created_at).toLocaleDateString('ja-JP')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              / 更新日: {new Date(member.updated_at).toLocaleDateString('ja-JP')}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>メンバーを削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{member.name}」を削除します。この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleteMemberMutation.isPending}
          >
            {deleteMemberMutation.isPending ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
