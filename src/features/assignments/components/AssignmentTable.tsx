import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import {
  useAssignmentsByProject,
  useUpsertAssignment,
  useDeleteAssignmentsByMemberAndProject,
} from '../hooks';
import AssignmentCell from './AssignmentCell';
import AssignMemberDialog from './AssignMemberDialog';

interface AssignmentTableProps {
  projectId: string;
  startMonth: string;
  endMonth: string | null;
}

function generateMonths(start: string, end: string | null): string[] {
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

function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  return `${year}/${m}`;
}

interface MemberRow {
  memberId: string;
  memberName: string;
  cells: Map<string, { assignmentId: string; percentage: number | null }>;
}

export default function AssignmentTable({
  projectId,
  startMonth,
  endMonth,
}: AssignmentTableProps) {
  const { data: assignments, isLoading } = useAssignmentsByProject(projectId);
  const upsertAssignment = useUpsertAssignment();
  const deleteByMemberAndProject = useDeleteAssignmentsByMemberAndProject();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    memberId: string;
    memberName: string;
  } | null>(null);

  const months = useMemo(
    () => generateMonths(startMonth, endMonth),
    [startMonth, endMonth]
  );

  const rows = useMemo(() => {
    if (!assignments) return [];

    const memberMap = new Map<string, MemberRow>();

    for (const a of assignments) {
      let row = memberMap.get(a.member_id);
      if (!row) {
        row = {
          memberId: a.member_id,
          memberName: a.members.name,
          cells: new Map(),
        };
        memberMap.set(a.member_id, row);
      }
      row.cells.set(a.month, {
        assignmentId: a.id,
        percentage: a.percentage,
      });
      // Update name if it was empty (from optimistic update)
      if (a.members.name && !row.memberName) {
        row.memberName = a.members.name;
      }
    }

    return Array.from(memberMap.values()).sort((a, b) =>
      a.memberName.localeCompare(b.memberName, 'ja')
    );
  }, [assignments]);

  const existingMemberIds = useMemo(
    () => rows.map((r) => r.memberId),
    [rows]
  );

  const handleCellChange = (
    memberId: string,
    month: string,
    value: number | null
  ) => {
    upsertAssignment.mutate({
      member_id: memberId,
      project_id: projectId,
      month,
      percentage: value,
    });
  };

  const handleDeleteMember = () => {
    if (!deleteTarget) return;
    deleteByMemberAndProject.mutate(
      {
        memberId: deleteTarget.memberId,
        projectId,
      },
      { onSuccess: () => setDeleteTarget(null) }
    );
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" fontWeight="bold">
          アサイン
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          size="small"
        >
          メンバー追加
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 120,
            bgcolor: 'grey.50',
            borderRadius: 1,
          }}
        >
          <Typography color="text.secondary">
            アサインされたメンバーがいません
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    position: 'sticky',
                    left: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    minWidth: 140,
                  }}
                >
                  メンバー
                </TableCell>
                {months.map((month) => (
                  <TableCell
                    key={month}
                    align="center"
                    sx={{ fontWeight: 'bold', minWidth: 80, whiteSpace: 'nowrap' }}
                  >
                    {formatMonthLabel(month)}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.memberId} hover>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      bgcolor: 'background.paper',
                      zIndex: 1,
                      fontWeight: 500,
                    }}
                  >
                    {row.memberName}
                  </TableCell>
                  {months.map((month) => {
                    const cell = row.cells.get(month);
                    return (
                      <TableCell key={month} align="center" sx={{ p: 0.5 }}>
                        <AssignmentCell
                          value={cell?.percentage ?? null}
                          onChange={(value) =>
                            handleCellChange(row.memberId, month, value)
                          }
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell sx={{ p: 0.5 }}>
                    <Tooltip title="このメンバーのアサインを全て削除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setDeleteTarget({
                            memberId: row.memberId,
                            memberName: row.memberName,
                          })
                        }
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AssignMemberDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        projectId={projectId}
        startMonth={startMonth}
        endMonth={endMonth}
        existingMemberIds={existingMemberIds}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>アサインを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{deleteTarget?.memberName}」のアサインを全て削除しますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteMember}
            color="error"
            variant="contained"
            disabled={deleteByMemberAndProject.isPending}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
