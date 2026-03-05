import { useState, useRef, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';

interface AssignmentCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function AssignmentCell({ value, onChange }: AssignmentCellProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = () => {
    setInputValue(value != null ? String(value) : '');
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const trimmed = inputValue.trim();
    if (trimmed === '') {
      onChange(null);
      return;
    }
    const num = Number(trimmed);
    if (!isNaN(num) && num >= 0 && num <= 200) {
      onChange(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commit();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <TextField
        inputRef={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        type="number"
        size="small"
        slotProps={{
          htmlInput: { min: 0, max: 200, style: { textAlign: 'center', padding: '4px 8px' } },
        }}
        sx={{ width: 72 }}
      />
    );
  }

  return (
    <Box
      onClick={startEditing}
      sx={{
        cursor: 'pointer',
        minHeight: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        '&:hover': { bgcolor: 'grey.100' },
        px: 1,
      }}
    >
      <Typography variant="body2">
        {value != null ? `${value}%` : ''}
      </Typography>
    </Box>
  );
}
