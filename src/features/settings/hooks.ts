import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProjectCategoryMaster,
  createRoleCandidateMaster,
  createSkillMaster,
  deleteRoleCandidateMaster,
  deleteProjectCategoryMaster,
  deleteSkillMaster,
  fetchProjectCategories,
  fetchRoleCandidates,
  fetchSkillsMaster,
  updateProjectCategoryMaster,
  updateRoleCandidateMaster,
  updateSkillMaster,
} from './api';

export const settingsKeys = {
  skills: ['settings', 'skills'] as const,
  projectCategories: ['settings', 'project-categories'] as const,
  roleCandidates: ['settings', 'role-candidates'] as const,
};

function invalidateSkillConsumers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: settingsKeys.skills });
  void queryClient.invalidateQueries({ queryKey: ['skills'] });
  void queryClient.invalidateQueries({ queryKey: ['members'] });
  void queryClient.invalidateQueries({ queryKey: ['assignments'] });
  void queryClient.invalidateQueries({ queryKey: ['schedule'] });
  void queryClient.invalidateQueries({ queryKey: ['export'] });
}

function invalidateProjectCategoryConsumers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: settingsKeys.projectCategories });
  void queryClient.invalidateQueries({ queryKey: ['projects'] });
  void queryClient.invalidateQueries({ queryKey: ['export'] });
}

function invalidateRoleCandidateConsumers(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: settingsKeys.roleCandidates });
}

export function useSkillsMaster() {
  return useQuery({
    queryKey: settingsKeys.skills,
    queryFn: fetchSkillsMaster,
  });
}

export function useProjectCategories() {
  return useQuery({
    queryKey: settingsKeys.projectCategories,
    queryFn: fetchProjectCategories,
  });
}

export function useRoleCandidates() {
  return useQuery({
    queryKey: settingsKeys.roleCandidates,
    queryFn: fetchRoleCandidates,
  });
}

export function useCreateSkillMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSkillMaster,
    onSettled: () => invalidateSkillConsumers(queryClient),
  });
}

export function useUpdateSkillMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateSkillMaster(id, name),
    onSettled: () => invalidateSkillConsumers(queryClient),
  });
}

export function useDeleteSkillMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSkillMaster,
    onSettled: () => invalidateSkillConsumers(queryClient),
  });
}

export function useCreateProjectCategoryMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectCategoryMaster,
    onSettled: () => invalidateProjectCategoryConsumers(queryClient),
  });
}

export function useUpdateProjectCategoryMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ currentName, nextName }: { currentName: string; nextName: string }) =>
      updateProjectCategoryMaster(currentName, nextName),
    onSettled: () => invalidateProjectCategoryConsumers(queryClient),
  });
}

export function useDeleteProjectCategoryMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProjectCategoryMaster,
    onSettled: () => invalidateProjectCategoryConsumers(queryClient),
  });
}

export function useCreateRoleCandidateMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoleCandidateMaster,
    onSettled: () => invalidateRoleCandidateConsumers(queryClient),
  });
}

export function useUpdateRoleCandidateMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ currentName, nextName }: { currentName: string; nextName: string }) =>
      updateRoleCandidateMaster(currentName, nextName),
    onSettled: () => invalidateRoleCandidateConsumers(queryClient),
  });
}

export function useDeleteRoleCandidateMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoleCandidateMaster,
    onSettled: () => invalidateRoleCandidateConsumers(queryClient),
  });
}
