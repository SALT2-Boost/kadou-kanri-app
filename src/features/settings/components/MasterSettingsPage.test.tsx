import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UnsavedChangesProvider } from '@/shared/hooks/useUnsavedChanges';
import MasterSettingsPage from './MasterSettingsPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <UnsavedChangesProvider>
        <MasterSettingsPage />
      </UnsavedChangesProvider>
    </MemoryRouter>,
  );
}

const createSkill = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const updateSkill = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const deleteSkill = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const createProjectCategory = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const updateProjectCategory = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const deleteProjectCategory = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const createRoleCandidate = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const updateRoleCandidate = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const deleteRoleCandidate = {
  mutateAsync: vi.fn(),
  isPending: false,
};

vi.mock('../hooks', () => ({
  useSkillsMaster: vi.fn(() => ({
    data: [
      { id: 's-1', name: 'DS' },
      { id: 's-2', name: 'SWE' },
    ],
    isLoading: false,
  })),
  useProjectCategories: vi.fn(() => ({
    data: [{ name: '戦コン' }, { name: 'データサイエンス' }],
    isLoading: false,
  })),
  useRoleCandidates: vi.fn(() => ({
    data: [{ name: 'PM' }, { name: 'SWE' }],
    isLoading: false,
  })),
  useCreateSkillMaster: vi.fn(() => createSkill),
  useUpdateSkillMaster: vi.fn(() => updateSkill),
  useDeleteSkillMaster: vi.fn(() => deleteSkill),
  useCreateProjectCategoryMaster: vi.fn(() => createProjectCategory),
  useUpdateProjectCategoryMaster: vi.fn(() => updateProjectCategory),
  useDeleteProjectCategoryMaster: vi.fn(() => deleteProjectCategory),
  useCreateRoleCandidateMaster: vi.fn(() => createRoleCandidate),
  useUpdateRoleCandidateMaster: vi.fn(() => updateRoleCandidate),
  useDeleteRoleCandidateMaster: vi.fn(() => deleteRoleCandidate),
}));

describe('MasterSettingsPage', () => {
  beforeEach(() => {
    createSkill.mutateAsync.mockReset().mockResolvedValue(undefined);
    updateSkill.mutateAsync.mockReset().mockResolvedValue(undefined);
    deleteSkill.mutateAsync.mockReset().mockResolvedValue(undefined);
    createProjectCategory.mutateAsync.mockReset().mockResolvedValue(undefined);
    updateProjectCategory.mutateAsync.mockReset().mockResolvedValue(undefined);
    deleteProjectCategory.mutateAsync.mockReset().mockResolvedValue(undefined);
    createRoleCandidate.mutateAsync.mockReset().mockResolvedValue(undefined);
    updateRoleCandidate.mutateAsync.mockReset().mockResolvedValue(undefined);
    deleteRoleCandidate.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('PJカテゴリとスキルのマスタ一覧を表示する', () => {
    renderPage();

    expect(screen.getByText('マスタ設定')).toBeInTheDocument();
    expect(screen.getByText('PJカテゴリ')).toBeInTheDocument();
    expect(screen.getByText('ロール候補')).toBeInTheDocument();
    expect(screen.getByText('スキル')).toBeInTheDocument();
    expect(screen.getByText('戦コン')).toBeInTheDocument();
    expect(screen.getByText('データサイエンス')).toBeInTheDocument();
    expect(screen.getByText('PM')).toBeInTheDocument();
    expect(screen.getAllByText('SWE')).toHaveLength(2);
    expect(screen.getByText('DS')).toBeInTheDocument();
  });

  it('ロール候補を追加できる', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'ロール追加' }));
    fireEvent.change(screen.getByLabelText('名前'), { target: { value: 'QA' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(createRoleCandidate.mutateAsync).toHaveBeenCalledWith({ name: 'QA' });
    });
  });

  it('スキルを追加できる', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'スキル追加' }));
    fireEvent.change(screen.getByLabelText('名前'), { target: { value: 'AIE' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(createSkill.mutateAsync).toHaveBeenCalledWith({ name: 'AIE' });
    });
  });

  it('PJカテゴリを追加できる', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'カテゴリ追加' }));
    fireEvent.change(screen.getByLabelText('名前'), { target: { value: '新カテゴリ' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(createProjectCategory.mutateAsync).toHaveBeenCalledWith({ name: '新カテゴリ' });
    });
  });

  it('既存マスタを編集できる', async () => {
    renderPage();

    const skillRow = screen.getByText('DS').closest('li');
    fireEvent.click(within(skillRow as HTMLElement).getByRole('button', { name: '編集' }));
    const input = screen.getByLabelText('名前');
    fireEvent.change(input, { target: { value: 'DS改' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(updateSkill.mutateAsync).toHaveBeenCalledWith({ id: 's-1', name: 'DS改' });
    });
  });
});
