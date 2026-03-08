export type StaffingTarget = {
  role: string;
  percentage: number;
};

export type StaffingTargetDraft = {
  role: string;
  percentage: string;
};

export function toDraftStaffingTargets(
  targets: StaffingTarget[] | null | undefined,
): StaffingTargetDraft[] {
  if (!targets || targets.length === 0) return [];
  return targets.map((target) => ({
    role: target.role,
    percentage: String(target.percentage),
  }));
}

export function validateAndNormalizeStaffingTargets(drafts: StaffingTargetDraft[]): {
  value: StaffingTarget[];
  error: string | null;
} {
  const normalized: StaffingTarget[] = [];

  for (let i = 0; i < drafts.length; i += 1) {
    const role = drafts[i].role.trim();
    const percentageText = drafts[i].percentage.trim();
    const rowNumber = i + 1;

    if (role === '' && percentageText === '') continue;

    if (role === '' || percentageText === '') {
      return {
        value: [],
        error: `希望スペック${rowNumber}行目は、ロールと割合を両方入力してください。`,
      };
    }

    const percentage = Number(percentageText);
    if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) {
      return {
        value: [],
        error: `希望スペック${rowNumber}行目の割合は0〜100の整数で入力してください。`,
      };
    }

    normalized.push({ role, percentage });
  }

  return { value: normalized, error: null };
}

export function formatStaffingTargetsSummary(targets: StaffingTarget[] | null | undefined): string {
  if (!targets || targets.length === 0) return '-';
  return targets.map((target) => `${target.role} ${target.percentage}%`).join(' / ');
}
