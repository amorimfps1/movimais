import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AuthPage from '@/pages/AuthPage';

// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null, isApproved: false })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  }),
}));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );
  };

  it('Renders login form by default with email and password inputs', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('Shows "Acesso ao Sistema" heading in login mode', () => {
    renderComponent();
    expect(screen.getByText('Acesso ao Sistema')).toBeInTheDocument();
  });

  it('Switches to register mode when clicking "Criar Conta" button', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    expect(screen.getByText('Novo Cadastro')).toBeInTheDocument();
  });

  it('Shows "Novo Cadastro" heading in register mode', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    expect(screen.getByText('Novo Cadastro')).toBeInTheDocument();
  });

  it('Shows password minimum length hint in register mode', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    expect(screen.getByText(/mínimo de 6 caracteres/i)).toBeInTheDocument();
  });

  it('Submit button shows "Entrar no Sistema" in login mode', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: 'Entrar no Sistema' })).toBeInTheDocument();
  });

  it('Submit button shows "Solicitar Acesso" in register mode', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    expect(screen.getByRole('button', { name: 'Solicitar Acesso' })).toBeInTheDocument();
  });

  it('Login form submits and calls supabase.auth.signInWithPassword', async () => {
    const mockUser = { id: 'test-uuid', email: 'test@example.com' };
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    // Mock the from().select().eq().maybeSingle() chain for profiles and roles queries
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: { status: 'aprovado' }, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ select: mockSelect });

    renderComponent();
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar no Sistema' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('Shows error toast on failed login', async () => {
    (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: new Error('Invalid credentials'),
    });

    renderComponent();
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar no Sistema' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('Toggle password visibility', () => {
    renderComponent();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // The toggle button is next to the password label with text "Mostrar"
    const toggleButton = screen.getByText('Mostrar');
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideButton = screen.getByText('Ocultar');
    fireEvent.click(hideButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
