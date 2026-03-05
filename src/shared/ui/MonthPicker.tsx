import { useMemo } from 'react';
import { TextField, MenuItem } from '@mui/material';

interface MonthPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  fullWidth?: boolean;
  yearRange?: [number, number];
}

function generateMonthOptions(yearRange: [number, number]) {
  const options: Array<{ value: string; label: string }> = [];
  for (let y = yearRange[0]; y <= yearRange[1]; y++) {
    for (let m = 1; m <= 12; m++) {
      const value = `${y}-${String(m).padStart(2, '0')}`;
      options.push({ value, label: `${y}年${m}月` });
    }
  }
  return options;
}

export default function MonthPicker({
  label,
  value,
  onChange,
  required = false,
  fullWidth = false,
  yearRange,
}: MonthPickerProps) {
  const currentYear = new Date().getFullYear();
  const range = yearRange ?? [currentYear - 1, currentYear + 2];

  const options = useMemo(() => generateMonthOptions(range), [range[0], range[1]]);

  return (
    <TextField
      label={label}
      select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      fullWidth={fullWidth}
      slotProps={{ inputLabel: { shrink: true } }}
    >
      <MenuItem value="">
        <em>未選択</em>
      </MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
