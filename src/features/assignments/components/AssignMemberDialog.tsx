import { useState, useEffect } from 'react';
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { supabase } from '@/shared/lib/supabase';
import { useUpsertAssignment } from '../hooks';

interface ActiveMember {
  id: string;
  name: string;
  category: string;
}

interface AssignMemberDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  startMonth: string;
  endMonth: string | null;
  existingMemberIds: string[];
}

function generateMonthRange(start: string, end: string | null): string[] {
  const months: string[] = [];
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (!endDate) {
    for (let i = 0; i < 12; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      );
    }
  } else {
    const current = new Date(startDate);
    while (current <= endDate) {
      months.push(
        `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-01`
      );
      current.setMonth(current.getMonth() + 1);
    }
  }

  return months;
}

export default function AssignMemberDialog({
  open,
  onClose,
  projectId,
  startMonth,
  endMonth,
  existingMemberIds,
}: AssignMemberDialogProps) {
  const [members, setMembers] = useState<ActiveMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<ActiveMember | null>(
    null
  );
  const [percentage, setPercentage] = useState('100');
  const [loading, setLoading] = useState(false);
  const upsertAssignment = useUpsertAssignment();

  useEffect(() => {
    if (!open) return;

    const loadMembers = async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setMembers(
          (data as ActiveMember[]).filter(
            (m) => !existingMemberIds.includes(m.id)
          )
        );
      }
    };

    void loadMembers();
    setSelectedMember(null);
    setPercentage('100');
  }, [open, existingMemberIds]);

  const handleSave = async () => {
    if (!selectedMember) return;

    const months = generateMonthRange(startMonth, endMonth);
    const pct = percentage.trim() === '' ? null : Number(percentage);

    setLoading(true);
    try {
      for (const month of months) {
        await upsertAssignment.mutateAsync({
          member_id: selectedMember.id,
          project_id: projectId,
          month,
          percentage: pct,
        });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>メンバーを追加</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Autocomplete
            options={members}
            getOptionLabel={(option) => `${option.name} (${option.category})`}
            value={selectedMember}
            onChange={(_e, value) => setSelectedMember(value)}
            renderInput={(params) => (
              <TextField {...params} label="メンバー" placeholder="名前で検索" />
            )}
            noOptionsText="該当するメンバーがありません"
          />
          <TextField
            label="稼働率 (%)"
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 200 } }}
            helperText="全月に同じ値を設定します（後から個別に変更可能）"
          />
          <Typography variant="body2" color="text.secondary">
            期間: {startMonth.slice(0, 7).replace('-', '/')} -{' '}
            {endMonth
              ? endMonth.slice(0, 7).replace('-', '/')
              : `${startMonth.slice(0, 7).replace('-', '/')} + 12ヶ月`}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!selectedMember || loading}
        >
          追加
        </Button>
      </DialogActions>
    </Dialog>
  );
}
