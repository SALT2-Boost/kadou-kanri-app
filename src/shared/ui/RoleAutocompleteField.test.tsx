import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import RoleAutocompleteField from './RoleAutocompleteField';

function Harness() {
  const [value, setValue] = useState('');

  return (
    <>
      <RoleAutocompleteField
        label="PJ role"
        value={value}
        options={['PM', 'SWE', 'DS']}
        onChange={setValue}
      />
      <div data-testid="role-value">{value}</div>
    </>
  );
}

describe('RoleAutocompleteField', () => {
  it('候補を出しつつ自由入力できる', () => {
    render(<Harness />);

    const input = screen.getByLabelText('PJ role');
    fireEvent.change(input, { target: { value: 'QA' } });

    expect(screen.getByTestId('role-value')).toHaveTextContent('QA');
  });

  it('候補を選択できる', async () => {
    render(<Harness />);

    const input = screen.getByLabelText('PJ role');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const option = await screen.findByText('PM');
    fireEvent.click(option);

    expect(screen.getByTestId('role-value')).toHaveTextContent('PM');
  });
});
