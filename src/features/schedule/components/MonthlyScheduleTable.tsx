import { useMemo } from 'react';
import {
  Box,
  Chip,
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
import SkillChip from '@/shared/ui/SkillChip';
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';
import type { MonthlyViewProject, MonthlyViewRow } from '../types';

interface MonthlyScheduleTableProps {
  rows: MonthlyViewRow[];
  projects: MonthlyViewProject[];
}

const STICKY_NAME_LEFT = 0;
const STICKY_ROLE_LEFT = 180;
const STICKY_SKILLS_LEFT = 300;
const PROJECT_COLUMN_WIDTH = 150;
const TOTAL_COLUMN_WIDTH = 84;
const STICKY_BG = 'background.paper';
const UNCONFIRMED_ROW_BG = 'rgba(255, 152, 0, 0.04)';
const UNCONFIRMED_STICKY_BG = 'rgba(255, 152, 0, 0.06)';

function formatPercentage(value: number | undefined): string {
  return value && value > 0 ? `${value}%` : '';
}

function getStickyCellStyles(left: number, highlighted: boolean) {
  return {
    position: 'sticky' as const,
    left,
    zIndex: 1,
    bgcolor: highlighted ? UNCONFIRMED_STICKY_BG : STICKY_BG,
  };
}

export default function MonthlyScheduleTable({ rows, projects }: MonthlyScheduleTableProps) {
  const grouped = useMemo(() => {
    const groupedMap = new Map<string, MonthlyViewRow[]>();
    for (const category of MEMBER_CATEGORIES) {
      groupedMap.set(category, []);
    }
    for (const row of rows) {
      const bucket = groupedMap.get(row.category);
      if (bucket) {
        bucket.push(row);
      }
    }
    return MEMBER_CATEGORIES.map((category) => ({
      category,
      members: groupedMap.get(category) ?? [],
    })).filter((group) => group.members.length > 0);
  }, [rows]);

  if (projects.length === 0 || rows.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 180,
          bgcolor: 'grey.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography color="text.secondary">対象月の稼働データがありません</Typography>
      </Box>
    );
  }

  const tableMinWidth =
    STICKY_SKILLS_LEFT + 220 + projects.length * PROJECT_COLUMN_WIDTH + TOTAL_COLUMN_WIDTH;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table stickyHeader size="small" sx={{ minWidth: tableMinWidth, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  ...getStickyCellStyles(STICKY_NAME_LEFT, false),
                  minWidth: 180,
                  fontWeight: 'bold',
                }}
              >
                メンバー名
              </TableCell>
              <TableCell
                sx={{
                  ...getStickyCellStyles(STICKY_ROLE_LEFT, false),
                  minWidth: 120,
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                }}
              >
                role
              </TableCell>
              <TableCell
                sx={{
                  ...getStickyCellStyles(STICKY_SKILLS_LEFT, false),
                  minWidth: 220,
                  fontWeight: 'bold',
                }}
              >
                スキル
              </TableCell>
              {projects.map((project, index) => (
                <TableCell
                  key={project.id}
                  align="center"
                  sx={{
                    minWidth: PROJECT_COLUMN_WIDTH,
                    borderLeft: '1px solid',
                    borderLeftColor: 'divider',
                    borderRight: index === projects.length - 1 ? '1px solid' : undefined,
                    borderRightColor: index === projects.length - 1 ? 'divider' : undefined,
                    bgcolor: STICKY_BG,
                    px: 1,
                  }}
                >
                  <Tooltip title={project.name}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        display: '-webkit-box',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 2,
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                      }}
                    >
                      {project.name}
                    </Typography>
                  </Tooltip>
                </TableCell>
              ))}
              <TableCell
                align="center"
                sx={{
                  position: 'sticky',
                  right: 0,
                  zIndex: 3,
                  minWidth: TOTAL_COLUMN_WIDTH,
                  fontWeight: 'bold',
                  bgcolor: 'grey.100',
                  borderLeft: '2px solid',
                  borderLeftColor: 'divider',
                }}
              >
                合計
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grouped.map((group) => (
              <MonthlyGroupRows key={group.category} group={group} projects={projects} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

interface MonthlyGroupRowsProps {
  group: {
    category: string;
    members: MonthlyViewRow[];
  };
  projects: MonthlyViewProject[];
}

function MonthlyGroupRows({ group, projects }: MonthlyGroupRowsProps) {
  const totalColumns = 4 + projects.length;

  return (
    <>
      <TableRow>
        <TableCell colSpan={totalColumns} sx={{ bgcolor: 'grey.200', fontWeight: 'bold', py: 0.5 }}>
          {group.category}
        </TableCell>
      </TableRow>
      {group.members.map((row) => {
        const isUnconfirmed = row.isUnconfirmed;

        return (
          <TableRow
            key={row.rowId}
            hover
            sx={
              isUnconfirmed
                ? {
                    borderLeft: '3px dashed',
                    borderLeftColor: 'warning.main',
                    bgcolor: UNCONFIRMED_ROW_BG,
                  }
                : undefined
            }
          >
            <TableCell
              sx={{
                ...getStickyCellStyles(STICKY_NAME_LEFT, isUnconfirmed),
                minWidth: 180,
                whiteSpace: 'nowrap',
              }}
            >
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography
                    fontWeight={500}
                    color={isUnconfirmed ? 'text.secondary' : 'text.primary'}
                    fontStyle={isUnconfirmed ? 'italic' : 'normal'}
                  >
                    {row.memberName}
                  </Typography>
                  {isUnconfirmed && <Chip label="未確定" size="small" color="warning" />}
                </Stack>
              </Stack>
            </TableCell>
            <TableCell
              sx={{
                ...getStickyCellStyles(STICKY_ROLE_LEFT, isUnconfirmed),
                minWidth: 120,
                whiteSpace: 'nowrap',
              }}
            >
              {row.role}
            </TableCell>
            <TableCell
              sx={{
                ...getStickyCellStyles(STICKY_SKILLS_LEFT, isUnconfirmed),
                minWidth: 220,
              }}
            >
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {row.skills.map((skill) => (
                  <SkillChip key={skill} name={skill} />
                ))}
              </Stack>
            </TableCell>
            {projects.map((project, index) => {
              const pct = row.projects[project.id];
              return (
                <TableCell
                  key={project.id}
                  align="center"
                  sx={{
                    py: 0.75,
                    borderLeft: '1px solid',
                    borderLeftColor: 'divider',
                    borderRight: index === projects.length - 1 ? '1px solid' : undefined,
                    borderRightColor: index === projects.length - 1 ? 'divider' : undefined,
                  }}
                >
                  <Typography variant="body2" fontWeight={pct && pct >= 100 ? 700 : 400}>
                    {formatPercentage(pct)}
                  </Typography>
                </TableCell>
              );
            })}
            <TableCell
              align="center"
              sx={{
                position: 'sticky',
                right: 0,
                zIndex: 1,
                py: 0.75,
                bgcolor: isUnconfirmed ? UNCONFIRMED_STICKY_BG : 'grey.50',
                borderLeft: '2px solid',
                borderLeftColor: 'divider',
              }}
            >
              <Typography
                variant="body2"
                fontWeight={row.totalPercentage > 100 ? 'bold' : 600}
                color={row.totalPercentage > 100 ? 'error' : 'text.primary'}
              >
                {formatPercentage(row.totalPercentage)}
              </Typography>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
