import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
  Stack,
  Chip,
} from '@mui/material';
import { useSkills, useCreateMember, useUpdateMember, useUpdateMemberSkills } from '../hooks';
import type { MemberWithSkills, Skill } from '../types';

interface MemberFormProps {
  open: boolean;
  onClose: () => void;
  member?: MemberWithSkills;
}

const CATEGORIES = ['社員', '入社予定', 'インターン'] as const;

export default function MemberForm({ open, onClose, member }: MemberFormProps) {
  const { data: skills = [] } = useSkills();
  const createMember = useCreateMember();
  const updateMemberMutation = useUpdateMember();
  const updateMemberSkills = useUpdateMemberSkills();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('社員');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [note, setNote] = useState('');
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (open) {
      if (member) {
        setName(member.name);
        setCategory(member.category);
        setSelectedSkills(
          member.member_skills.map((ms) => ms.skills)
        );
        setNote(member.note ?? '');
      } else {
        setName('');
        setCategory('社員');
        setSelectedSkills([]);
        setNote('');
      }
      setNameError(false);
    }
  }, [open, member]);

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }

    const skillIds = selectedSkills.map((s) => s.id);

    try {
      if (member) {
        // 更新
        await updateMemberMutation.mutateAsync({
          id: member.id,
          input: { name: name.trim(), category, note: note.trim() || null },
        });
        await updateMemberSkills.mutateAsync({ memberId: member.id, skillIds });
      } else {
        // 新規作成
        const created = await createMember.mutateAsync({
          name: name.trim(),
          category,
          note: note.trim() || null,
        });
        await updateMemberSkills.mutateAsync({ memberId: created.id, skillIds });
      }
      onClose();
    } catch {
      // エラーは TanStack Query が管理
    }
  };

  const isSubmitting =
    createMember.isPending || updateMemberMutation.isPending || updateMemberSkills.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{member ? 'メンバー編集' : '新規メンバー'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="名前"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError(false);
            }}
            error={nameError}
            helperText={nameError ? '名前は必須です' : ''}
            required
            fullWidth
            autoFocus
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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
