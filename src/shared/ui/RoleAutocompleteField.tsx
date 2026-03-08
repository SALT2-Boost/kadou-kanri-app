import { Autocomplete, TextField } from '@mui/material';

interface RoleAutocompleteFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  helperText?: string;
  required?: boolean;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export default function RoleAutocompleteField({
  label,
  value,
  options,
  onChange,
  helperText,
  required = false,
  size = 'medium',
  disabled = false,
}: RoleAutocompleteFieldProps) {
  const normalizedOptions = Array.from(
    new Set(options.map((option) => option.trim()).filter((option) => option !== '')),
  );

  return (
    <Autocomplete
      freeSolo
      disablePortal
      openOnFocus
      selectOnFocus
      handleHomeEndKeys
      options={normalizedOptions}
      value={value}
      inputValue={value}
      disabled={disabled}
      onChange={(_event, newValue) => {
        onChange(typeof newValue === 'string' ? newValue : (newValue ?? ''));
      }}
      onInputChange={(_event, newInputValue, reason) => {
        if (reason === 'input' || reason === 'clear') {
          onChange(newInputValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          helperText={helperText}
          required={required}
          size={size}
        />
      )}
    />
  );
}
