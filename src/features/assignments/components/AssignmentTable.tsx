import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import { useAssignmentsByProject, useDeleteProjectMember, useUpsertAssignment } from '../hooks';
import { buildProjectMemberRows } from '../transforms';
import type { ProjectMemberWithAssignments } from '../types';
import AssignmentCell from './AssignmentCell';
import AssignMemberDialog from './AssignMemberDialog';
import ConfirmProjectMemberDialog from './ConfirmProjectMemberDialog';
import { buildInclusiveMonthStartRange, buildMonthStartRange } from '@/shared/lib/months';

interface AssignmentTableProps {
  projectId: string;
  startMonth: string;
  endMonth: string | null;
}

const MEMBER_COLUMN_WIDTH = 220;
const ROLE_COLUMN_WIDTH = 140;
const SKILLS_COLUMN_WIDTH = 220;

function generateMonths(start: string, end: string | null): string[] {
  return end ? buildInclusiveMonthStartRange(start, end) : buildMonthStartRange(start, 12);
}

function formatMonthLabel(month: string): string {
  const [year, value] = month.split('-');
  return `${year}/${value}`;
}

export default function AssignmentTable({ projectId, startMonth, endMonth }: AssignmentTableProps) {
  const { data: projectMembers, isLoading } = useAssignmentsByProject(projectId);
  const upsertAssignment = useUpsertAssignment();
  const deleteProjectMember = useDeleteProjectMember();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectMemberWithAssignments | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    projectMemberId: string;
    memberName: string;
    isUnconfirmed: boolean;
  } | null>(null);

  const months = useMemo(() => generateMonths(startMonth, endMonth), [startMonth, endMonth]);

  const rows = useMemo(() => buildProjectMemberRows(projectMembers ?? []), [projectMembers]);

  const existingMemberIds = useMemo(
    () => rows.flatMap((row) => (row.memberId ? [row.memberId] : [])),
    [rows],
  );

  const handleCellChange = (projectMemberId: string, month: string, value: number | null) => {
    upsertAssignment.mutate({
      project_member_id: projectMemberId,
      month,
      percentage: value,
    });
  };

  const handleDeleteMember = () => {
    if (!deleteTarget) return;
    deleteProjectMember.mutate(deleteTarget.projectMemberId, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  if (isLoading) return <LoadingOverlay />;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          PJメンバー
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          size="small"
        >
          PJメンバー追加
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
          <Typography color="text.secondary">PJメンバーがまだ設定されていません</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ overflowX: 'auto', maxWidth: '100%' }}>
          <Table
            size="small"
            sx={{
              minWidth:
                MEMBER_COLUMN_WIDTH +
                ROLE_COLUMN_WIDTH +
                SKILLS_COLUMN_WIDTH +
                months.length * 80 +
                120,
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    minWidth: MEMBER_COLUMN_WIDTH,
                    width: MEMBER_COLUMN_WIDTH,
                    maxWidth: MEMBER_COLUMN_WIDTH,
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    bgcolor: 'background.paper',
                    borderRight: '1px solid',
                    borderRightColor: 'divider',
                  }}
                >
                  メンバー
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    minWidth: ROLE_COLUMN_WIDTH,
                    width: ROLE_COLUMN_WIDTH,
                    maxWidth: ROLE_COLUMN_WIDTH,
                    position: 'sticky',
                    left: MEMBER_COLUMN_WIDTH,
                    zIndex: 3,
                    bgcolor: 'background.paper',
                    borderRight: '1px solid',
                    borderRightColor: 'divider',
                  }}
                >
                  role
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    minWidth: SKILLS_COLUMN_WIDTH,
                    width: SKILLS_COLUMN_WIDTH,
                    maxWidth: SKILLS_COLUMN_WIDTH,
                    position: 'sticky',
                    left: MEMBER_COLUMN_WIDTH + ROLE_COLUMN_WIDTH,
                    zIndex: 3,
                    bgcolor: 'background.paper',
                    borderRight: '2px solid',
                    borderRightColor: 'divider',
                  }}
                >
                  skills
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
                <TableCell sx={{ width: 120 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.projectMemberId}
                  hover
                  sx={row.isUnconfirmed ? { bgcolor: 'rgba(255, 152, 0, 0.04)' } : undefined}
                >
                  <TableCell
                    sx={{
                      fontWeight: 500,
                      minWidth: MEMBER_COLUMN_WIDTH,
                      width: MEMBER_COLUMN_WIDTH,
                      maxWidth: MEMBER_COLUMN_WIDTH,
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      bgcolor: row.isUnconfirmed ? 'rgba(255, 152, 0, 0.06)' : 'background.paper',
                      borderRight: '1px solid',
                      borderRightColor: 'divider',
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {row.memberId ? (
                          <Link
                            component={RouterLink}
                            to={`/members/${row.memberId}`}
                            underline="hover"
                            color="inherit"
                            fontWeight={500}
                          >
                            {row.memberName}
                          </Link>
                        ) : (
                          <Typography fontWeight={500}>{row.memberName}</Typography>
                        )}
                        {row.isUnconfirmed && <Chip label="未確定" size="small" color="warning" />}
                      </Stack>
                      {row.note && (
                        <Typography variant="caption" color="text.secondary">
                          {row.note}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: ROLE_COLUMN_WIDTH,
                      width: ROLE_COLUMN_WIDTH,
                      maxWidth: ROLE_COLUMN_WIDTH,
                      position: 'sticky',
                      left: MEMBER_COLUMN_WIDTH,
                      zIndex: 1,
                      bgcolor: row.isUnconfirmed ? 'rgba(255, 152, 0, 0.06)' : 'background.paper',
                      borderRight: '1px solid',
                      borderRightColor: 'divider',
                    }}
                  >
                    {row.role}
                  </TableCell>
                  <TableCell
                    sx={{
                      minWidth: SKILLS_COLUMN_WIDTH,
                      width: SKILLS_COLUMN_WIDTH,
                      maxWidth: SKILLS_COLUMN_WIDTH,
                      position: 'sticky',
                      left: MEMBER_COLUMN_WIDTH + ROLE_COLUMN_WIDTH,
                      zIndex: 1,
                      bgcolor: row.isUnconfirmed ? 'rgba(255, 152, 0, 0.06)' : 'background.paper',
                      borderRight: '2px solid',
                      borderRightColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {row.skillNames.join(' / ')}
                    </Typography>
                  </TableCell>
                  {months.map((month) => {
                    const cell = row.cells.get(month);
                    return (
                      <TableCell key={month} align="center" sx={{ p: 0.5 }}>
                        <AssignmentCell
                          value={cell?.percentage ?? null}
                          onChange={(value) => handleCellChange(row.projectMemberId, month, value)}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell sx={{ p: 0.5 }}>
                    <Stack direction="row" spacing={0.5}>
                      {row.isUnconfirmed && (
                        <Tooltip title="実メンバーへ差し替え">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setConfirmTarget(row.projectMemberId)}
                          >
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="PJメンバー編集">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setEditTarget(
                              projectMembers?.find((item) => item.id === row.projectMemberId) ??
                                null,
                            )
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="PJメンバー削除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setDeleteTarget({
                              projectMemberId: row.projectMemberId,
                              memberName: row.memberName,
                              isUnconfirmed: row.isUnconfirmed,
                            })
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {addDialogOpen ? (
        <AssignMemberDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          projectId={projectId}
          startMonth={startMonth}
          endMonth={endMonth}
          existingMemberIds={existingMemberIds}
        />
      ) : null}

      {editTarget ? (
        <AssignMemberDialog
          open
          onClose={() => setEditTarget(null)}
          projectId={projectId}
          startMonth={startMonth}
          endMonth={endMonth}
          existingMemberIds={existingMemberIds}
          projectMember={editTarget}
        />
      ) : null}

      {confirmTarget ? (
        <ConfirmProjectMemberDialog
          open
          onClose={() => setConfirmTarget(null)}
          projectMemberId={confirmTarget}
          existingMemberIds={existingMemberIds}
        />
      ) : null}

      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>PJメンバーを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.isUnconfirmed
              ? `「${deleteTarget?.memberName}」を未確定枠ごと削除しますか？`
              : `「${deleteTarget?.memberName}」のPJメンバー設定と稼働を削除しますか？`}
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
            disabled={deleteProjectMember.isPending}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
