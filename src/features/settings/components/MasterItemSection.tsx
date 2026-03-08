import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useUnsavedChangesDialogGuard } from '@/shared/hooks/useUnsavedChanges';

interface MasterItem {
  key: string;
  name: string;
}

interface MasterItemSectionProps {
  title: string;
  addLabel: string;
  emptyText: string;
  deleteDescription: string;
  items: MasterItem[];
  isLoading?: boolean;
  onCreate: (name: string) => Promise<unknown>;
  onUpdate: (item: MasterItem, name: string) => Promise<unknown>;
  onDelete: (item: MasterItem) => Promise<unknown>;
}

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; item: MasterItem }
  | { type: 'delete'; item: MasterItem }
  | null;

export default function MasterItemSection({
  title,
  addLabel,
  emptyText,
  deleteDescription,
  items,
  isLoading = false,
  onCreate,
  onUpdate,
  onDelete,
}: MasterItemSectionProps) {
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isEditingDialogOpen = dialogState?.type === 'create' || dialogState?.type === 'edit';

  useEffect(() => {
    if (!dialogState) {
      setName('');
      setError(null);
      setSubmitting(false);
      return;
    }

    if (dialogState.type === 'edit') {
      setName(dialogState.item.name);
    } else {
      setName('');
    }
    setError(null);
    setSubmitting(false);
  }, [dialogState]);

  const closeDialog = () => setDialogState(null);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('名前は必須です。');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (dialogState?.type === 'create') {
        await onCreate(trimmed);
      } else if (dialogState?.type === 'edit') {
        await onUpdate(dialogState.item, trimmed);
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (dialogState?.type !== 'delete') return;

    setSubmitting(true);
    setError(null);

    try {
      await onDelete(dialogState.item);
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました。');
      setSubmitting(false);
    }
  };

  const isDirty =
    dialogState?.type === 'create'
      ? name.trim() !== ''
      : dialogState?.type === 'edit'
        ? name.trim() !== dialogState.item.name.trim()
        : false;
  const { requestClose, dialogProps } = useUnsavedChangesDialogGuard(
    isEditingDialogOpen && isDirty,
    closeDialog,
  );

  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setDialogState({ type: 'create' })}
        >
          {addLabel}
        </Button>
      </Stack>

      {isLoading ? (
        <Typography color="text.secondary">読み込み中...</Typography>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">{emptyText}</Typography>
      ) : (
        <List disablePadding>
          {items.map((item) => (
            <ListItem
              key={item.key}
              disablePadding
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    aria-label="編集"
                    onClick={() => setDialogState({ type: 'edit', item })}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="削除"
                    color="error"
                    onClick={() => setDialogState({ type: 'delete', item })}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
              sx={{
                py: 1.5,
                pr: 12,
                borderTop: '1px solid',
                borderTopColor: 'divider',
              }}
            >
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog
        open={isEditingDialogOpen}
        onClose={dialogProps.onClose}
        disableEscapeKeyDown={dialogProps.disableEscapeKeyDown}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {dialogState?.type === 'edit' ? `${title}を編集` : `${title}を追加`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              label="名前"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={requestClose} disabled={submitting}>
            キャンセル
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogState?.type === 'delete'} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>{title}を削除</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <DialogContentText>
              「{dialogState?.type === 'delete' ? dialogState.item.name : ''}」を削除しますか？
            </DialogContentText>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {deleteDescription}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={submitting}>
            キャンセル
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={submitting}>
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
