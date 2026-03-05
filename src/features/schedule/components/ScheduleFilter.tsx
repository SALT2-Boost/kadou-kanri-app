import {
  Stack,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  InputAdornment,
  Box,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SkillChip from '@/shared/ui/SkillChip';
import { MEMBER_CATEGORIES } from '@/shared/constants/categories';

interface ScheduleFilterProps {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  skills: Array<{ id: string; name: string }>;
}

export default function ScheduleFilter({
  categories,
  onCategoriesChange,
  selectedSkills,
  onSkillsChange,
  searchText,
  onSearchTextChange,
  skills,
}: ScheduleFilterProps) {
  const handleCategoryToggle = (category: string) => {
    if (categories.includes(category)) {
      onCategoriesChange(categories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...categories, category]);
    }
  };

  const handleSkillToggle = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      onSkillsChange(selectedSkills.filter((s) => s !== skillName));
    } else {
      onSkillsChange([...selectedSkills, skillName]);
    }
  };

  return (
    <Stack direction="row" flexWrap="wrap" alignItems="center" spacing={3} sx={{ mb: 2 }}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          区分
        </Typography>
        <FormGroup row>
          {MEMBER_CATEGORIES.map((cat) => (
            <FormControlLabel
              key={cat}
              control={
                <Checkbox
                  size="small"
                  checked={categories.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                />
              }
              label={cat}
            />
          ))}
        </FormGroup>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          スキル
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {skills.map((skill) => (
            <SkillChip
              key={skill.id}
              name={skill.name}
              selected={selectedSkills.includes(skill.name)}
              onClick={() => handleSkillToggle(skill.name)}
            />
          ))}
        </Stack>
      </Box>

      <TextField
        size="small"
        placeholder="名前検索"
        value={searchText}
        onChange={(e) => onSearchTextChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 200 }}
      />
    </Stack>
  );
}
