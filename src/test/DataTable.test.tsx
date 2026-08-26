import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DataTable from '@/components/DataTable';

const mockData = [
  { id: '1', nome: 'Alice Silva', status: 'ATIVO', email: 'alice@test.com' },
  { id: '2', nome: 'Bob Santos', status: 'INATIVO', email: 'bob@test.com' },
  { id: '3', nome: 'Carlos Oliveira', status: 'ATIVO', email: 'carlos@test.com' },
];

const mockColumns = [
  { key: 'nome', label: 'Nome' },
  { key: 'status', label: 'Status' },
  { key: 'email', label: 'E-mail' },
];

describe('DataTable', () => {
  it('Renders all data rows', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    expect(screen.getByText('Bob Santos')).toBeInTheDocument();
    expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
  });

  it('Renders column headers', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('E-mail')).toBeInTheDocument();
  });

  it('Filters data when typing in search input', async () => {
    render(<DataTable data={mockData} columns={mockColumns} searchKeys={['nome', 'email']} />);
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    await waitFor(() => {
      expect(screen.getByText('Alice Silva')).toBeInTheDocument();
      expect(screen.queryByText('Bob Santos')).not.toBeInTheDocument();
    });
  });

  it('Shows "Nenhum registro encontrado" when filter matches nothing', async () => {
    render(<DataTable data={mockData} columns={mockColumns} searchKeys={['nome']} />);
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'Xyz123' } });

    await waitFor(() => {
      expect(screen.getByText(/Nenhum registro/i)).toBeInTheDocument();
    });
  });

  it('Calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<DataTable data={mockData} columns={mockColumns} onEdit={onEdit} />);
    const editButtons = screen.getAllByTitle(/editar/i);
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('Shows delete confirmation dialog when delete button is clicked', async () => {
    render(<DataTable data={mockData} columns={mockColumns} onDelete={vi.fn()} />);
    const deleteButtons = screen.getAllByTitle(/excluir/i);
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/excluir registro/i)).toBeInTheDocument();
    });
  });

  it('Calls onDelete when confirming deletion', async () => {
    const onDelete = vi.fn();
    render(<DataTable data={mockData} columns={mockColumns} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByTitle(/excluir/i);
    fireEvent.click(deleteButtons[0]);

    const confirmButton = await screen.findByRole('button', { name: /excluir/i });
    fireEvent.click(confirmButton);
    expect(onDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it('Shows export CSV button', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText(/exportar csv/i)).toBeInTheDocument();
  });

  it('Paginates correctly', () => {
    render(<DataTable data={mockData} columns={mockColumns} pageSizeDefault={2} />);
    expect(screen.getByText('Alice Silva')).toBeInTheDocument();
    expect(screen.getByText('Bob Santos')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Oliveira')).not.toBeInTheDocument();

    const nextButton = screen.getByTitle('Próxima página');
    expect(nextButton).toBeInTheDocument();
  });
});
