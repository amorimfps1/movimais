import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('Returns null when status is null/undefined', () => {
    const { container } = render(<StatusBadge status={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('Renders "ATIVO" with emerald classes', () => {
    render(<StatusBadge status="ATIVO" />);
    const badge = screen.getByText('ATIVO').parentElement;
    expect(badge).toHaveClass('bg-emerald-500/10');
    expect(badge).toHaveClass('text-emerald-400');
  });

  it('Renders "PENDENTE" with amber classes', () => {
    render(<StatusBadge status="PENDENTE" />);
    const badge = screen.getByText('PENDENTE').parentElement;
    expect(badge).toHaveClass('bg-amber-500/10');
    expect(badge).toHaveClass('text-amber-400');
  });

  it('Renders "ATRASADO" with rose classes and label text "Atrasado"', () => {
    render(<StatusBadge status="ATRASADO" />);
    const badge = screen.getByText('Atrasado').parentElement;
    expect(badge).toHaveClass('bg-rose-500/10');
    expect(badge).toHaveClass('text-rose-400');
  });

  it('Renders "INATIVO" with zinc classes', () => {
    render(<StatusBadge status="INATIVO" />);
    const badge = screen.getByText('INATIVO').parentElement;
    expect(badge).toHaveClass('bg-zinc-500/10');
    expect(badge).toHaveClass('text-zinc-400');
  });

  it('Renders unknown status with default zinc styling and underscore-replaced text', () => {
    render(<StatusBadge status="STATUS_DESCONHECIDO" />);
    const textElement = screen.getByText('STATUS DESCONHECIDO');
    const badge = textElement.parentElement;
    expect(textElement).toBeInTheDocument();
    expect(badge).toHaveClass('bg-zinc-500/10');
  });

  it('Applies custom className', () => {
    render(<StatusBadge status="ATIVO" className="my-custom-class" />);
    const badge = screen.getByText('ATIVO').parentElement;
    expect(badge).toHaveClass('my-custom-class');
  });
});
