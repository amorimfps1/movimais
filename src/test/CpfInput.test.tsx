import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import CpfInput from '@/components/CpfInput';

function CpfInputWrapper({ showValidation = true }: { showValidation?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <div>
      <CpfInput
        value={value}
        onChange={(raw, masked, valid) => {
          setValue(masked);
        }}
        showValidation={showValidation}
      />
    </div>
  );
}

describe('CpfInput', () => {
  it('Renders with placeholder "000.000.000-00"', () => {
    render(<CpfInputWrapper />);
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument();
  });

  it('Displays "valido" when given a valid complete CPF value', () => {
    render(<CpfInputWrapper />);
    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '529.982.247-25' } });
    expect(screen.getByText('valido')).toBeInTheDocument();
    expect(screen.getByText('valido')).toHaveClass('text-success');
  });

  it('Displays "invalido" when given an invalid complete CPF value', () => {
    render(<CpfInputWrapper />);
    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '111.111.111-11' } });
    expect(screen.getByText('invalido')).toBeInTheDocument();
    expect(screen.getByText('invalido')).toHaveClass('text-destructive');
  });

  it('Does not show validation indicator for incomplete CPF', () => {
    render(<CpfInputWrapper />);
    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '123' } });
    expect(screen.queryByText('valido')).not.toBeInTheDocument();
    expect(screen.queryByText('invalido')).not.toBeInTheDocument();
  });

  it('Calls onChange with correct (raw, masked, valid) arguments when user types', () => {
    const handleChange = vi.fn();
    render(<CpfInput value="" onChange={handleChange} />);
    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '123' } });
    expect(handleChange).toHaveBeenCalledWith('123', '123', false);
  });

  it('Applies destructive class when CPF is invalid', () => {
    render(<CpfInputWrapper />);
    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '111.111.111-11' } });
    expect(input).toHaveClass('border-destructive');
  });

  it('Applies success class when CPF is valid', () => {
    render(<CpfInputWrapper />);
    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '529.982.247-25' } });
    expect(input).toHaveClass('border-success');
  });

  it('Does not show validation when showValidation=false', () => {
    render(<CpfInputWrapper showValidation={false} />);
    const input = screen.getByPlaceholderText('000.000.000-00');
    fireEvent.change(input, { target: { value: '111.111.111-11' } });
    expect(screen.queryByText('invalido')).not.toBeInTheDocument();
    expect(input).not.toHaveClass('border-destructive');
  });
});
