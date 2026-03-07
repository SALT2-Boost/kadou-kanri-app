import { useMemo, useState } from 'react';
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
import { useActiveMembers, useConfirmProjectMember } from '../hooks';
import type { ActiveMember } from '../types';

interface ConfirmProjectMemberDialogProps {
  open: boolean;
  onClose: () => void;
  projectMemberId: string | null;
  existingMemberIds: string[];
}

export default function ConfirmProjectMemberDialog({
  open,
  onClose,
  projectMemberId,
  existingMemberIds,
}: ConfirmProjectMemberDialogProps) {
  const { data: activeMembers = [] } = useActiveMembers(open);
  const confirmProjectMember = useConfirmProjectMember();
  const [selectedMember, setSelectedMember] = useState<ActiveMember | null>(null);

  const selectableMembers = useMemo(
    () => activeMembers.filter((member) => !existingMemberIds.includes(member.id)),
    [activeMembers, existingMemberIds],
  );

  const handleClose = () => {
    setSelectedMember(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!projectMemberId || !selectedMember) return;
    await confirmProjectMember.mutateAsync({
      projectMemberId,
      memberId: selectedMember.id,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>未確定枠を実メンバーへ差し替え</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            options={selectableMembers}
            getOptionLabel={(option) => `${option.name} (${option.category})`}
            value={selectedMember}
            onChange={(_event, value) => setSelectedMember(value)}
            renderInput={(params) => (
              <TextField {...params} label="実メンバー" placeholder="名前で検索" />
            )}
            noOptionsText="選択可能なメンバーがいません"
          />
          <Typography variant="body2" color="text.secondary">
            稼働率とPJ側の role / skills はそのまま引き継ぎます。
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selectedMember || confirmProjectMember.isPending}
        >
          差し替え
        </Button>
      </DialogActions>
    </Dialog>
  );
}
