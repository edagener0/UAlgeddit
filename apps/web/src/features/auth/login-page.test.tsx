import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithProviders } from '@/test/render';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  const mockFetch = (handler: (url: string, init?: RequestInit) => Response) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => handler(url, init)),
    );

  it('validates required fields with the shared zod schema', async () => {
    mockFetch(() => jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401));
    renderWithProviders(<LoginPage />, { path: '/login', route: '/login' });

    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
  });

  it('signs in and redirects', async () => {
    mockFetch((url) =>
      url.endsWith('/auth/login')
        ? jsonResponse({ user: { id: 1, username: 'demo', avatarUrl: null }, token: 't' })
        : jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401),
    );
    renderWithProviders(<LoginPage />, { path: '/login', route: '/login' });

    await userEvent.type(await screen.findByLabelText('Username'), 'demo');
    await userEvent.type(screen.getByLabelText('Password'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
    const loginCall = vi
      .mocked(fetch)
      .mock.calls.find(([url]) => String(url).endsWith('/auth/login'));
    expect(JSON.parse(String(loginCall?.[1]?.body))).toEqual({
      username: 'demo',
      password: 'Password123',
    });
  });
});
