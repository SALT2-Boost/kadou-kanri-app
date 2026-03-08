import { Box, Stack } from '@mui/material';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import PageHeader from '@/shared/ui/PageHeader';
import MasterItemSection from './MasterItemSection';
import {
  useCreateProjectCategoryMaster,
  useCreateRoleCandidateMaster,
  useCreateSkillMaster,
  useDeleteRoleCandidateMaster,
  useDeleteProjectCategoryMaster,
  useDeleteSkillMaster,
  useProjectCategories,
  useRoleCandidates,
  useSkillsMaster,
  useUpdateRoleCandidateMaster,
  useUpdateProjectCategoryMaster,
  useUpdateSkillMaster,
} from '../hooks';

export default function MasterSettingsPage() {
  const { data: projectCategories = [], isLoading: projectCategoriesLoading } =
    useProjectCategories();
  const { data: roleCandidates = [], isLoading: roleCandidatesLoading } = useRoleCandidates();
  const { data: skills = [], isLoading: skillsLoading } = useSkillsMaster();
  const createSkill = useCreateSkillMaster();
  const updateSkill = useUpdateSkillMaster();
  const deleteSkill = useDeleteSkillMaster();
  const createProjectCategory = useCreateProjectCategoryMaster();
  const updateProjectCategory = useUpdateProjectCategoryMaster();
  const deleteProjectCategory = useDeleteProjectCategoryMaster();
  const createRoleCandidate = useCreateRoleCandidateMaster();
  const updateRoleCandidate = useUpdateRoleCandidateMaster();
  const deleteRoleCandidate = useDeleteRoleCandidateMaster();

  if (projectCategoriesLoading && roleCandidatesLoading && skillsLoading) {
    return <LoadingOverlay />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="マスタ設定" />

      <Stack spacing={3}>
        <MasterItemSection
          title="PJカテゴリ"
          addLabel="カテゴリ追加"
          emptyText="PJカテゴリがありません"
          deleteDescription="案件で使用中のカテゴリは削除できません。名称変更は案件にも反映されます。"
          items={projectCategories.map((item) => ({
            key: item.name,
            name: item.name,
          }))}
          isLoading={projectCategoriesLoading}
          onCreate={(name) => createProjectCategory.mutateAsync({ name })}
          onUpdate={(item, name) =>
            updateProjectCategory.mutateAsync({ currentName: item.name, nextName: name })
          }
          onDelete={(item) => deleteProjectCategory.mutateAsync(item.name)}
        />

        <MasterItemSection
          title="ロール候補"
          addLabel="ロール追加"
          emptyText="ロール候補がありません"
          deleteDescription="削除しても既存のPJ roleは変わりません。候補一覧から外れるだけです。"
          items={roleCandidates.map((item) => ({
            key: item.name,
            name: item.name,
          }))}
          isLoading={roleCandidatesLoading}
          onCreate={(name) => createRoleCandidate.mutateAsync({ name })}
          onUpdate={(item, name) =>
            updateRoleCandidate.mutateAsync({ currentName: item.name, nextName: name })
          }
          onDelete={(item) => deleteRoleCandidate.mutateAsync(item.name)}
        />

        <MasterItemSection
          title="スキル"
          addLabel="スキル追加"
          emptyText="スキルがありません"
          deleteDescription="削除するとメンバー/PJメンバーに紐づく同名スキルも外れます。"
          items={skills.map((item) => ({
            key: item.id,
            name: item.name,
          }))}
          isLoading={skillsLoading}
          onCreate={(name) => createSkill.mutateAsync({ name })}
          onUpdate={(item, name) => updateSkill.mutateAsync({ id: item.key, name })}
          onDelete={(item) => deleteSkill.mutateAsync(item.key)}
        />
      </Stack>
    </Box>
  );
}
