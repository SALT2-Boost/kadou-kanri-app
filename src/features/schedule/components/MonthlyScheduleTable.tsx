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
import GuardedLink from '@/shared/ui/GuardedLink';
import SkillChip from '@/shared/ui/SkillChip';
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';
import type { MonthlyViewProject, MonthlyViewRow } from '../types';
import UtilizationSummary from './UtilizationSummary';

interface MonthlyScheduleTableProps {
  rows: MonthlyViewRow[];
  projects: MonthlyViewProject[];
}

const NAME_COLUMN_WIDTH = 220;
const SKILLS_COLUMN_WIDTH = 260;
const FIXED_COLUMNS_WIDTH = NAME_COLUMN_WIDTH + SKILLS_COLUMN_WIDTH;
const STICKY_NAME_LEFT = 0;
const STICKY_SKILLS_LEFT = NAME_COLUMN_WIDTH;
const PROJECT_COLUMN_WIDTH = 150;
const TOTAL_COLUMN_WIDTH = 84;
const STICKY_BG = 'background.paper';
const UNCONFIRMED_ROW_BG = 'rgba(255, 152, 0, 0.04)';
const UNCONFIRMED_STICKY_BG = 'rgba(255, 152, 0, 0.06)';
const HEADER_STICKY_Z_INDEX = 4;
const BODY_STICKY_Z_INDEX = 2;
const GROUP_STICKY_Z_INDEX = 3;

function getStickyCellStyles(left: number, highlighted: boolean, zIndex: number) {
  return {
    position: 'sticky' as const,
    left,
    zIndex,
    bgcolor: highlighted ? UNCONFIRMED_STICKY_BG : STICKY_BG,
    boxSizing: 'border-box' as const,
  };
}

function getFixedColumnStyles(width: number) {
  return {
    width,
    minWidth: width,
    maxWidth: width,
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
    NAME_COLUMN_WIDTH +
    SKILLS_COLUMN_WIDTH +
    projects.length * PROJECT_COLUMN_WIDTH +
    TOTAL_COLUMN_WIDTH;

  return (
    <Box>
      <TableContainer
        sx={{
          maxWidth: '100%',
          overflowX: 'auto',
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Table stickyHeader size="small" sx={{ minWidth: tableMinWidth, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  ...getStickyCellStyles(STICKY_NAME_LEFT, false, HEADER_STICKY_Z_INDEX),
                  ...getFixedColumnStyles(NAME_COLUMN_WIDTH),
                  fontWeight: 'bold',
                  borderRight: '1px solid',
                  borderRightColor: 'divider',
                }}
              >
                メンバー名
              </TableCell>
              <TableCell
                sx={{
                  ...getStickyCellStyles(STICKY_SKILLS_LEFT, false, HEADER_STICKY_Z_INDEX),
                  ...getFixedColumnStyles(SKILLS_COLUMN_WIDTH),
                  fontWeight: 'bold',
                  borderRight: '2px solid',
                  borderRightColor: 'divider',
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
                    zIndex: 1,
                    px: 1,
                  }}
                >
                  <Tooltip title={project.name}>
                    <GuardedLink
                      to={`/projects/${project.id}`}
                      underline="hover"
                      color="inherit"
                      sx={{ display: 'block' }}
                    >
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
                    </GuardedLink>
                  </Tooltip>
                </TableCell>
              ))}
              <TableCell
                align="center"
                sx={{
                  position: 'sticky',
                  right: 0,
                  zIndex: HEADER_STICKY_Z_INDEX,
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
  const totalColumns = 3 + projects.length;
  const scrollingColumns = totalColumns - 2;

  return (
    <>
      <TableRow>
        <TableCell
          colSpan={2}
          sx={{
            position: 'sticky',
            left: 0,
            zIndex: GROUP_STICKY_Z_INDEX,
            width: FIXED_COLUMNS_WIDTH,
            minWidth: FIXED_COLUMNS_WIDTH,
            maxWidth: FIXED_COLUMNS_WIDTH,
            bgcolor: 'grey.200',
            fontWeight: 'bold',
            py: 0.5,
            borderRight: '2px solid',
            borderRightColor: 'divider',
          }}
        >
          {group.category}
        </TableCell>
        <TableCell colSpan={scrollingColumns} sx={{ bgcolor: 'grey.200', py: 0.5 }} />
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
                ...getStickyCellStyles(STICKY_NAME_LEFT, isUnconfirmed, BODY_STICKY_Z_INDEX),
                ...getFixedColumnStyles(NAME_COLUMN_WIDTH),
                whiteSpace: 'nowrap',
                borderRight: '1px solid',
                borderRightColor: 'divider',
              }}
            >
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {row.memberId ? (
                    <GuardedLink
                      to={`/members/${row.memberId}`}
                      underline="hover"
                      color="inherit"
                      sx={{ display: 'inline-flex' }}
                    >
                      <Typography fontWeight={500} noWrap>
                        {row.memberName}
                      </Typography>
                    </GuardedLink>
                  ) : (
                    <Typography
                      fontWeight={500}
                      color={isUnconfirmed ? 'text.secondary' : 'text.primary'}
                      fontStyle={isUnconfirmed ? 'italic' : 'normal'}
                      noWrap
                    >
                      {row.memberName}
                    </Typography>
                  )}
                  {isUnconfirmed && <Chip label="未確定" size="small" color="warning" />}
                </Stack>
              </Stack>
            </TableCell>
            <TableCell
              sx={{
                ...getStickyCellStyles(STICKY_SKILLS_LEFT, isUnconfirmed, BODY_STICKY_Z_INDEX),
                ...getFixedColumnStyles(SKILLS_COLUMN_WIDTH),
                borderRight: '2px solid',
                borderRightColor: 'divider',
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
              const isTentativeProject = project.status !== '確定';
              return (
                <TableCell
                  key={project.id}
                  align="center"
                  sx={{
                    py: 0.75,
                    bgcolor: isTentativeProject
                      ? isUnconfirmed
                        ? 'grey.200'
                        : 'grey.100'
                      : undefined,
                    borderLeft: '1px solid',
                    borderLeftColor: 'divider',
                    borderRight: index === projects.length - 1 ? '1px solid' : undefined,
                    borderRightColor: index === projects.length - 1 ? 'divider' : undefined,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={pct && pct >= 100 ? 700 : 400}
                    color={isTentativeProject ? 'text.secondary' : 'text.primary'}
                  >
                    {pct && pct > 0 ? `${pct}%` : ''}
                  </Typography>
                </TableCell>
              );
            })}
            <TableCell
              align="center"
              sx={{
                position: 'sticky',
                right: 0,
                zIndex: BODY_STICKY_Z_INDEX,
                py: 0.75,
                bgcolor: isUnconfirmed ? UNCONFIRMED_STICKY_BG : 'grey.50',
                borderLeft: '2px solid',
                borderLeftColor: 'divider',
              }}
            >
              <UtilizationSummary
                confirmedPercentage={row.confirmedTotalPercentage}
                totalPercentage={row.totalPercentage}
              />
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
