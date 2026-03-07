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
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';
import MemberForm from './MemberForm';

export default function MemberList() {
  const navigate = useNavigate();
  const { data: members, isLoading } = useMembers();
  const { data: skills } = useSkills();

  const [formOpen, setFormOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(MEMBER_CATEGORIES),
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

  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter((m: MemberWithSkills) => {
      // 区分フィルタ
      if (!selectedCategories.has(m.category)) return false;
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
  }, [members, selectedCategories, debouncedSearch, selectedSkillIds]);

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
            {MEMBER_CATEGORIES.map((cat) => (
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名前</TableCell>
              <TableCell>role</TableCell>
              <TableCell>区分</TableCell>
              <TableCell>スキル</TableCell>
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
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.category}</TableCell>
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

      <MemberForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
