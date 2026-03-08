import { describe, expect, it } from 'vitest';
import { buildMemberScheduleRows } from './transforms';

describe('buildMemberScheduleRows', () => {
  it('案件ごとに今後の月別稼働を集約する', () => {
    const rows = buildMemberScheduleRows(
      [
        {
          project_id: 'p-1',
          month: '2026-03-01',
          percentage: 60,
          projects: { id: 'p-1', name: '案件A' },
        },
        {
          project_id: 'p-1',
          month: '2026-04-01',
          percentage: 40,
          projects: { id: 'p-1', name: '案件A' },
        },
        {
          project_id: 'p-2',
          month: '2026-03-01',
          percentage: 20,
          projects: { id: 'p-2', name: '案件B' },
        },
      ],
      ['2026-03-01', '2026-04-01'],
    );

    expect(rows).toEqual([
      {
        projectId: 'p-1',
        projectName: '案件A',
        months: {
          '2026-03-01': 60,
          '2026-04-01': 40,
        },
      },
      {
        projectId: 'p-2',
        projectName: '案件B',
        months: {
          '2026-03-01': 20,
          '2026-04-01': 0,
        },
      },
    ]);
  });

  it('同一案件・同月の複数稼働を合算する', () => {
    const rows = buildMemberScheduleRows(
      [
        {
          project_id: 'p-1',
          month: '2026-03-01',
          percentage: 30,
          projects: { id: 'p-1', name: '案件A' },
        },
        {
          project_id: 'p-1',
          month: '2026-03-01',
          percentage: 20,
          projects: { id: 'p-1', name: '案件A' },
        },
      ],
      ['2026-03-01'],
    );

    expect(rows[0].months['2026-03-01']).toBe(50);
  });
});
