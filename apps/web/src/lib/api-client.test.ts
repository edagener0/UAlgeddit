import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/render';
import { api, ApiError, buildUrl, errorMessage, toFormData } from './api-client';

describe('api client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('builds URLs and skips empty query values', () => {
    expect(buildUrl('/posts', { sort: 'top', q: '', page: 2, author: undefined })).toBe(
      '/api/posts?sort=top&page=2',
    );
  });

  it('sends JSON bodies with credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await api.post('/auth/login', { username: 'a' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/auth/login');
    expect(init.credentials).toBe('include');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"username":"a"}');
  });

  it('does not set a Content-Type for FormData (browser adds the boundary)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);
    await api.post('/posts', new FormData());
    expect(fetchMock.mock.calls[0]![1].headers['Content-Type']).toBeUndefined();
  });

  it('returns undefined for 204 responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(api.delete('/posts/1')).resolves.toBeUndefined();
  });

  it('throws ApiError with the server payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [{ path: 'title', message: 'Title is required' }],
            },
          },
          400,
        ),
      ),
    );
    const error = await api.get('/posts').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect(errorMessage(error)).toBe('Title is required');
  });

  it('copes with non-JSON error bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>', { status: 502, statusText: 'Bad Gateway' })),
    );
    const error = (await api.get('/x').catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.message).toBe('Bad Gateway');
  });
});

describe('toFormData', () => {
  it('appends scalars, files and file arrays, skipping nullish values', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const form = toFormData({
      title: 'Hi',
      subgedditId: 3,
      images: [file, file],
      icon: null,
      skip: undefined,
    });
    expect(form.get('title')).toBe('Hi');
    expect(form.get('subgedditId')).toBe('3');
    expect(form.getAll('images')).toHaveLength(2);
    expect(form.has('icon')).toBe(false);
    expect(form.has('skip')).toBe(false);
  });
});
