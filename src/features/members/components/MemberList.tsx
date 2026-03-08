import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Stack,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '@/shared/ui/PageHeader';
import LoadingOverlay from '@/shared/ui/LoadingOverlay';
import SkillChip from '@/shared/ui/SkillChip';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useMembers, useSkills } from '../hooks';
import type { MemberWithSkills } from '../types';
import { MEMBER_CATEGORIES, MEMBER_COMPANIES } from '@/shared/constants/categories';
import MemberForm from './MemberForm';

const MEMBER_LIST_CATEGORIES = MEMBER_CATEGORIES.filter((category) => category !== '未定枠');
const NAME_COLUMN_MAX_WIDTH = 260;

function formatJoinDateLabel(joinDate: string | null): string | null {
  if (!joinDate) return null;
  return `入社: ${joinDate.slice(0, 7).replace('-', '/')}`;
}

export default function MemberList() {
  const navigate = useNavigate();
  const { data: members, isLoading } = useMembers();
  const { data: skills } = useSkills();

  const [formOpen, setFormOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(MEMBER_LIST_CATEGORIES),
  );
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(
    new Set(MEMBER_COMPANIES),
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const toggleCompany = (company: string) => {
    setSelectedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(company)) {
        next.delete(company);
      } else {
        next.add(company);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter((m: MemberWithSkills) => {
      // 区分フィルタ
      if (!selectedCategories.has(m.category)) return false;
      if (!selectedCompanies.has(m.company)) return false;
      // 名前検索
      if (debouncedSearch && !m.name.includes(debouncedSearch)) return false;
      // スキルフィルタ
      if (selectedSkillIds.size > 0) {
        const memberSkillIds = new Set(m.member_skills.map((ms) => ms.skill_id));
        for (const sid of selectedSkillIds) {
          if (!memberSkillIds.has(sid)) return false;
        }
      }
      return true;
    });
  }, [members, selectedCategories, selectedCompanies, debouncedSearch, selectedSkillIds]);

  if (isLoading) return <LoadingOverlay />;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="メンバー一覧"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            新規メンバー
          </Button>
        }
      />

      {/* フィルタ */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
              区分
            </Typography>
            {MEMBER_LIST_CATEGORIES.map((cat) => (
              <FormControlLabel
                key={cat}
                control={
                  <Checkbox
                    checked={selectedCategories.has(cat)}
                    onChange={() => toggleCategory(cat)}
                    size="small"
                  />
                }
                label={cat}
              />
            ))}
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56 }}>
              会社
            </Typography>
            {MEMBER_COMPANIES.map((company) => (
              <FormControlLabel
                key={company}
                control={
                  <Checkbox
                    checked={selectedCompanies.has(company)}
                    onChange={() => toggleCompany(company)}
                    size="small"
                  />
                }
                label={company}
              />
            ))}
          </Stack>

          {skills && skills.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
                スキル
              </Typography>
              {skills.map((skill) => (
                <SkillChip
                  key={skill.id}
                  name={skill.name}
                  selected={selectedSkillIds.has(skill.id)}
                  onClick={() => toggleSkill(skill.id)}
                />
              ))}
            </Stack>
          )}

          <TextField
            size="small"
            placeholder="名前で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ maxWidth: 300 }}
          />
        </Stack>
      </Paper>

      {/* メンバー一覧テーブル */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <Table sx={{ minWidth: 860 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  width: '28%',
                  minWidth: 220,
                  maxWidth: NAME_COLUMN_MAX_WIDTH,
                }}
              >
                名前
              </TableCell>
              <TableCell sx={{ minWidth: 140, whiteSpace: 'nowrap' }}>区分</TableCell>
              <TableCell sx={{ minWidth: 170, whiteSpace: 'nowrap' }}>所属会社</TableCell>
              <TableCell sx={{ minWidth: 220 }}>スキル</TableCell>
              <TableCell>備考</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">メンバーが見つかりません</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((member) => (
                <TableRow
                  key={member.id}
                  hover
                  onClick={() => navigate(`/members/${member.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell
                    sx={{
                      width: '28%',
                      minWidth: 220,
                      maxWidth: NAME_COLUMN_MAX_WIDTH,
                      wordBreak: 'break-word',
                    }}
                  >
                    {member.name}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Stack spacing={0.25}>
                      <Typography variant="body2">{member.category}</Typography>
                      {member.category === '入社予定' && (
                        <Typography variant="caption" color="text.secondary">
                          {formatJoinDateLabel(member.join_date)}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{member.company}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {member.member_skills.map((ms) => (
                        <SkillChip key={ms.skill_id} name={ms.skills.name} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{member.note ?? ''}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {formOpen ? <MemberForm open={formOpen} onClose={() => setFormOpen(false)} /> : null}
    </Box>
  );
}
