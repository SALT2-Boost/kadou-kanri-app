import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSkills } from '@/features/members/hooks';
import type { Skill } from '@/features/members/types';
import { useRoleCandidates } from '@/features/settings/hooks';
import RoleAutocompleteField from '@/shared/ui/RoleAutocompleteField';
import { useActiveMembers, useCreateProjectMember, useUpdateProjectMemberProfile } from '../hooks';
import type { ActiveMember, ProjectMemberWithAssignments } from '../types';

interface AssignMemberDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  startMonth: string;
  endMonth: string | null;
  existingMemberIds: string[];
  projectMember?: ProjectMemberWithAssignments | null;
}

type AddMode = 'existing' | 'unconfirmed';
interface DialogDraft {
  mode: AddMode;
  selectedMember: ActiveMember | null;
  displayName: string;
  role: string;
  selectedSkills: Skill[];
  note: string;
  percentage: string;
  formError: string | null;
}

function buildDefaultUnconfirmedName(role: string): string {
  const trimmedRole = role.trim();
  return trimmedRole ? `未定要員(${trimmedRole})` : '未定要員';
}

function toSkillOptions(member: ActiveMember | null): Skill[] {
  if (!member) return [];
  return member.member_skills.map((link) => link.skills);
}

function createInitialDraft(projectMember?: ProjectMemberWithAssignments | null): DialogDraft {
  if (projectMember) {
    return {
      mode: projectMember.member_id ? 'existing' : 'unconfirmed',
      selectedMember: null,
      displayName: projectMember.name,
      role: projectMember.role,
      selectedSkills: projectMember.project_member_skills.map((link) => link.skills),
      note: projectMember.note ?? '',
      percentage: '100',
      formError: null,
    };
  }

  return {
    mode: 'existing',
    selectedMember: null,
    displayName: '',
    role: '',
    selectedSkills: [],
    note: '',
    percentage: '100',
    formError: null,
  };
}

export default function AssignMemberDialog({
  open,
  onClose,
  projectId,
  startMonth,
  endMonth,
  existingMemberIds,
  projectMember,
}: AssignMemberDialogProps) {
  const isEditMode = Boolean(projectMember);
  const { data: activeMembers = [] } = useActiveMembers(open);
  const { data: skills = [] } = useSkills();
  const { data: roleCandidates = [] } = useRoleCandidates();
  const createProjectMember = useCreateProjectMember();
  const updateProjectMemberProfile = useUpdateProjectMemberProfile();
  const roleOptions = roleCandidates.map((candidate) => candidate.name);

  const [draft, setDraft] = useState<DialogDraft | null>(null);
  const state = draft ?? createInitialDraft(projectMember);
  const { mode, selectedMember, displayName, role, selectedSkills, note, percentage, formError } =
    state;

  const selectableMembers = useMemo(
    () => activeMembers.filter((member) => !existingMemberIds.includes(member.id)),
    [activeMembers, existingMemberIds],
  );

  const previewName = useMemo(
    () => (mode === 'unconfirmed' ? displayName.trim() || buildDefaultUnconfirmedName(role) : ''),
    [displayName, mode, role],
  );

  const updateDraft = (updates: Partial<DialogDraft>) => {
    setDraft({
      ...state,
      ...updates,
    });
  };

  const handleClose = () => {
    setDraft(null);
    onClose();
  };

  const handleExistingMemberChange = (member: ActiveMember | null) => {
    updateDraft({
      selectedMember: member,
      displayName: member?.name ?? '',
      role: '',
      selectedSkills: toSkillOptions(member),
      formError: null,
    });
  };

  const handleSave = async () => {
    if (!role.trim()) {
      updateDraft({ formError: 'role を入力してください。' });
      return;
    }
    if (selectedSkills.length === 0) {
      updateDraft({ formError: '最低1つスキルを設定してください。' });
      return;
    }

    if (isEditMode && projectMember) {
      await updateProjectMemberProfile.mutateAsync({
        projectMemberId: projectMember.id,
        name: projectMember.member_id
          ? null
          : displayName.trim() || buildDefaultUnconfirmedName(role),
        role: role.trim(),
        note: note.trim() || null,
        skillIds: selectedSkills.map((skill) => skill.id),
      });
      handleClose();
      return;
    }

    const pct = percentage.trim() === '' ? null : Number(percentage);
    if (pct != null && (!Number.isFinite(pct) || Number.isNaN(pct) || pct < 0 || pct > 200)) {
      updateDraft({ formError: '稼働率は0〜200の範囲で入力してください。' });
      return;
    }

    if (mode === 'existing' && !selectedMember) {
      updateDraft({ formError: '追加するメンバーを選択してください。' });
      return;
    }

    const nameForCreate =
      mode === 'existing'
        ? (selectedMember?.name ?? '')
        : displayName.trim() || buildDefaultUnconfirmedName(role);

    await createProjectMember.mutateAsync({
      projectId,
      memberId: mode === 'existing' ? (selectedMember?.id ?? null) : null,
      name: nameForCreate,
      role: role.trim(),
      note: note.trim() || null,
      skillIds: selectedSkills.map((skill) => skill.id),
      startMonth,
      endMonth,
      percentage: pct,
    });
    handleClose();
  };

  const isSubmitting = createProjectMember.isPending || updateProjectMemberProfile.isPending;
  const canSave =
    role.trim() !== '' &&
    selectedSkills.length > 0 &&
    (isEditMode || (mode === 'existing' ? selectedMember !== null : true));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'PJメンバー編集' : 'PJメンバー追加'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {!isEditMode && (
            <Stack direction="row" spacing={1}>
              <Button
                variant={mode === 'existing' ? 'contained' : 'outlined'}
                onClick={() => {
                  updateDraft({
                    ...state,
                    mode: 'existing',
                    formError: null,
                  });
                }}
                size="small"
              >
                実メンバー
              </Button>
              <Button
                variant={mode === 'unconfirmed' ? 'contained' : 'outlined'}
                onClick={() => {
                  updateDraft({
                    ...state,
                    mode: 'unconfirmed',
                    selectedMember: null,
                    displayName: '',
                    role: '',
                    selectedSkills: [],
                    formError: null,
                  });
                }}
                size="small"
              >
                未確定枠
              </Button>
            </Stack>
          )}

          {(mode === 'existing' || (isEditMode && projectMember?.member_id)) && !isEditMode && (
            <Autocomplete
              options={selectableMembers}
              getOptionLabel={(option) => `${option.name} (${option.category})`}
              value={selectedMember}
              onChange={(_e, value) => handleExistingMemberChange(value)}
              renderInput={(params) => (
                <TextField {...params} label="実メンバー" placeholder="名前で検索" />
              )}
              noOptionsText="追加可能なメンバーがいません"
            />
          )}

          {isEditMode && projectMember?.member_id && (
            <TextField label="実メンバー" value={projectMember.name} disabled />
          )}

          {(mode === 'unconfirmed' || (isEditMode && !projectMember?.member_id)) && (
            <TextField
              label="表示名"
              value={displayName}
              onChange={(event) => {
                updateDraft({
                  displayName: event.target.value,
                  formError: null,
                });
              }}
              helperText="未入力の場合は role から自動生成します"
            />
          )}

          <RoleAutocompleteField
            label="PJ role"
            value={role}
            options={roleOptions}
            onChange={(nextRole) => {
              updateDraft({
                role: nextRole,
                formError: null,
              });
            }}
            required
            helperText="候補から選択できますが、自由入力も可能です"
          />

          <Autocomplete
            multiple
            options={skills}
            getOptionLabel={(option) => option.name}
            value={selectedSkills}
            onChange={(_e, newSkills) => {
              updateDraft({
                selectedSkills: newSkills,
                formError: null,
              });
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option.name} size="small" {...tagProps} />;
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="skills" placeholder="スキルを選択" />
            )}
            noOptionsText="スキルがありません"
          />

          <TextField
            label="メモ"
            value={note}
            onChange={(event) => updateDraft({ note: event.target.value })}
            multiline
            rows={2}
          />

          {!isEditMode && (
            <TextField
              label="稼働率 (%)"
              type="number"
              value={percentage}
              onChange={(event) => {
                updateDraft({
                  percentage: event.target.value,
                  formError: null,
                });
              }}
              slotProps={{ htmlInput: { min: 0, max: 200 } }}
              helperText="全月に同じ値を設定します（後から個別に変更可能）"
            />
          )}

          {(mode === 'unconfirmed' || (isEditMode && !projectMember?.member_id)) && (
            <Typography variant="body2" color="text.secondary">
              表示名プレビュー: {previewName}
            </Typography>
          )}

          {formError && (
            <Typography variant="body2" color="error">
              {formError}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          キャンセル
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave || isSubmitting}>
          {isEditMode ? '更新' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
