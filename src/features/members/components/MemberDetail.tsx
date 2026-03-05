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
import type { Skill } from '../types';

const CATEGORIES = ['社員', '入社予定', 'インターン'] as const;

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: member, isLoading } = useMember(id!);
  const { data: skills = [] } = useSkills();
  const updateMemberMutation = useUpdateMember();
  const updateMemberSkills = useUpdateMemberSkills();
  const deleteMemberMutation = useDeleteMember();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('社員');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [note, setNote] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // member データが来たら初期化
  if (member && !initialized) {
    setName(member.name);
    setCategory(member.category);
    setSelectedSkills(member.member_skills.map((ms) => ms.skills));
    setNote(member.note ?? '');
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!name.trim() || !id) return;

    try {
      await updateMemberMutation.mutateAsync({
        id,
        input: { name: name.trim(), category, note: note.trim() || null },
      });
      await updateMemberSkills.mutateAsync({
        memberId: id,
        skillIds: selectedSkills.map((s) => s.id),
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
              disabled={isSaving || !name.trim()}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            error={!name.trim()}
            helperText={!name.trim() ? '名前は必須です' : ''}
          />

          <FormControl fullWidth>
            <InputLabel>区分</InputLabel>
            <Select
              value={category}
              label="区分"
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            >
              {CATEGORIES.map((cat) => (
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
            value={selectedSkills}
            onChange={(_e, newValue) => setSelectedSkills(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.name}
                    size="small"
                    {...tagProps}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="スキル" placeholder="スキルを選択" />
            )}
          />

          <TextField
            label="備考"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={3}
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
