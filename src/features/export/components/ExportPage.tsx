import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import type { CsvColumn } from '../utils/exportHelpers';
import { jsonToCsv, downloadFile } from '../utils/exportHelpers';
import {
  useExportMembers,
  useExportProjects,
  useExportAssignments,
  useExportSkills,
} from '../hooks';
import type { ExportAssignment } from '../api';

type TableKey = 'members' | 'projects' | 'assignments' | 'skills';
type ExportFormat = 'csv' | 'json';

interface TableOption {
  key: TableKey;
  label: string;
}

const TABLE_OPTIONS: TableOption[] = [
  { key: 'members', label: 'メンバー' },
  { key: 'projects', label: '案件' },
  { key: 'assignments', label: 'アサイン' },
  { key: 'skills', label: 'スキル' },
];

const MEMBER_COLUMNS: CsvColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '名前' },
  { key: 'category', label: '区分' },
  { key: 'note', label: '備考' },
  { key: 'is_active', label: 'アクティブ' },
  { key: 'created_at', label: '作成日' },
];

const PROJECT_COLUMNS: CsvColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '案件名' },
  { key: 'monthly_revenue', label: '月額売上(万円)' },
  { key: 'start_month', label: '開始月' },
  { key: 'end_month', label: '終了月' },
  { key: 'status', label: 'ステータス' },
  { key: 'description', label: '概要' },
  { key: 'note', label: '備考' },
  { key: 'created_at', label: '作成日' },
];

const ASSIGNMENT_COLUMNS: CsvColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'member_name', label: 'メンバー名' },
  { key: 'project_name', label: '案件名' },
  { key: 'month', label: '月' },
  { key: 'percentage', label: '稼働%' },
  { key: 'note', label: '備考' },
];

const SKILL_COLUMNS: CsvColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'スキル名' },
];

function formatDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function flattenAssignments(
  data: ExportAssignment[],
): Record<string, unknown>[] {
  return data.map((row) => ({
    id: row.id,
    member_name: row.members?.name ?? '',
    project_name: row.projects?.name ?? '',
    month: row.month,
    percentage: row.percentage,
    note: row.note,
  }));
}

export default function ExportPage() {
  const [selected, setSelected] = useState<Set<TableKey>>(new Set());
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [downloading, setDownloading] = useState(false);

  const membersQuery = useExportMembers(selected.has('members'));
  const projectsQuery = useExportProjects(selected.has('projects'));
  const assignmentsQuery = useExportAssignments(selected.has('assignments'));
  const skillsQuery = useExportSkills(selected.has('skills'));

  const handleToggle = useCallback((key: TableKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleFormatChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, value: ExportFormat | null) => {
      if (value) setFormat(value);
    },
    [],
  );

  const isLoading =
    (selected.has('members') && membersQuery.isLoading) ||
    (selected.has('projects') && projectsQuery.isLoading) ||
    (selected.has('assignments') && assignmentsQuery.isLoading) ||
    (selected.has('skills') && skillsQuery.isLoading);

  const hasError =
    (selected.has('members') && membersQuery.isError) ||
    (selected.has('projects') && projectsQuery.isError) ||
    (selected.has('assignments') && assignmentsQuery.isError) ||
    (selected.has('skills') && skillsQuery.isError);

  const handleDownload = useCallback(() => {
    setDownloading(true);
    const dateStr = formatDate();

    try {
      if (selected.has('members') && membersQuery.data) {
        const data = membersQuery.data as unknown as Record<string, unknown>[];
        if (format === 'csv') {
          downloadFile(jsonToCsv(data, MEMBER_COLUMNS), `members_${dateStr}.csv`, 'csv');
        } else {
          downloadFile(JSON.stringify(membersQuery.data, null, 2), `members_${dateStr}.json`, 'json');
        }
      }

      if (selected.has('projects') && projectsQuery.data) {
        const data = projectsQuery.data as unknown as Record<string, unknown>[];
        if (format === 'csv') {
          downloadFile(jsonToCsv(data, PROJECT_COLUMNS), `projects_${dateStr}.csv`, 'csv');
        } else {
          downloadFile(JSON.stringify(projectsQuery.data, null, 2), `projects_${dateStr}.json`, 'json');
        }
      }

      if (selected.has('assignments') && assignmentsQuery.data) {
        const flat = flattenAssignments(assignmentsQuery.data);
        if (format === 'csv') {
          downloadFile(jsonToCsv(flat, ASSIGNMENT_COLUMNS), `assignments_${dateStr}.csv`, 'csv');
        } else {
          downloadFile(JSON.stringify(assignmentsQuery.data, null, 2), `assignments_${dateStr}.json`, 'json');
        }
      }

      if (selected.has('skills') && skillsQuery.data) {
        const data = skillsQuery.data as unknown as Record<string, unknown>[];
        if (format === 'csv') {
          downloadFile(jsonToCsv(data, SKILL_COLUMNS), `skills_${dateStr}.csv`, 'csv');
        } else {
          downloadFile(JSON.stringify(skillsQuery.data, null, 2), `skills_${dateStr}.json`, 'json');
        }
      }
    } finally {
      setDownloading(false);
    }
  }, [selected, format, membersQuery.data, projectsQuery.data, assignmentsQuery.data, skillsQuery.data]);

  const canDownload =
    selected.size > 0 &&
    !isLoading &&
    !downloading &&
    Array.from(selected).every((key) => {
      switch (key) {
        case 'members':
          return !!membersQuery.data;
        case 'projects':
          return !!projectsQuery.data;
        case 'assignments':
          return !!assignmentsQuery.data;
        case 'skills':
          return !!skillsQuery.data;
        default:
          return false;
      }
    });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        データエクスポート
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* テーブル選択 */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              エクスポート対象
            </Typography>
            <FormGroup>
              {TABLE_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.key}
                  control={
                    <Checkbox
                      checked={selected.has(opt.key)}
                      onChange={() => handleToggle(opt.key)}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </FormGroup>
          </Box>

          {/* フォーマット選択 */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              フォーマット
            </Typography>
            <ToggleButtonGroup
              value={format}
              exclusive
              onChange={handleFormatChange}
              size="small"
            >
              <ToggleButton value="csv">CSV</ToggleButton>
              <ToggleButton value="json">JSON</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* エラー表示 */}
          {hasError && (
            <Alert severity="error">
              データの取得中にエラーが発生しました。選択を確認してもう一度お試しください。
            </Alert>
          )}

          {/* ダウンロードボタン */}
          <Box>
            <Button
              variant="contained"
              startIcon={
                downloading || isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <DownloadIcon />
                )
              }
              disabled={!canDownload}
              onClick={handleDownload}
              sx={{ minWidth: 240 }}
            >
              {isLoading
                ? 'データ取得中...'
                : downloading
                  ? 'ダウンロード中...'
                  : '選択したテーブルを一括ダウンロード'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
