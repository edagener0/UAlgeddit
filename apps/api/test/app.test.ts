import request from 'supertest';
import { pino } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createContainer, type Container } from '../src/container.js';
import type { Database } from '../src/lib/prisma.js';
import { mockStorage } from './mocks.js';

/** HTTP-level tests: real Express app and middleware, services stubbed, no database. */
describe('HTTP API', () => {
  const env = loadEnv({ ...process.env, CORS_ORIGINS: 'http://localhost:5173' });
  const logger = pino({ level: 'silent' });
  let container: Container;
  let db: { $queryRaw: ReturnType<typeof vi.fn> };
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = { $queryRaw: vi.fn() };
    container = createContainer(env, db as unknown as Database, logger, { storage: mockStorage() });
    app = createApp(env, container, logger);
  });

  const signIn = () =>
    vi
      .spyOn(container.services.auth, 'authenticate')
      .mockResolvedValue({ id: 1, username: 'alice' });

  it('reports health based on the database', async () => {
    db.$queryRaw.mockResolvedValue([1]);
    await request(app).get('/api/health').expect(200, { status: 'ok', database: 'up' });

    db.$queryRaw.mockRejectedValue(new Error('down'));
    await request(app).get('/api/health').expect(503);
  });

  it('serves the OpenAPI document and Swagger UI', async () => {
    const { body } = await request(app).get('/api/docs/openapi.json').expect(200);
    expect(body.openapi).toBe('3.1.0');
    expect(Object.keys(body.paths)).toEqual(
      expect.arrayContaining([
        '/auth/login',
        '/posts',
        '/posts/{id}/comments',
        '/subgeddits/{name}',
      ]),
    );
    await request(app).get('/api/docs/').expect(200).expect('Content-Type', /html/);
  });

  it('does not expose the API docs in production', async () => {
    const prodEnv = loadEnv({ ...process.env, NODE_ENV: 'production' });
    const prodApp = createApp(prodEnv, container, logger);
    await request(prodApp).get('/api/docs/openapi.json').expect(404);
    await request(prodApp).get('/api/docs/').expect(404);
  });

  it('returns structured validation errors', async () => {
    const { body } = await request(app)
      .post('/api/auth/register')
      .send({ username: 'a', password: 'x', confirmPassword: 'y' })
      .expect(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.map((d: { path: string }) => d.path)).toEqual(
      expect.arrayContaining(['username', 'password']),
    );
  });

  it('rejects malformed JSON with 400', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username":')
      .expect(400);
  });

  it('requires authentication on protected routes', async () => {
    const { body } = await request(app).post('/api/posts').field('title', 'x').expect(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
    await request(app).get('/api/friends').expect(401);
  });

  it('blocks state-changing requests from foreign origins', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ username: 'a', password: 'b' })
      .expect(403);
  });

  it('allows CORS for configured origins with credentials', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('sets an httpOnly SameSite cookie on login', async () => {
    vi.spyOn(container.services.auth, 'login').mockResolvedValue({
      user: { id: 1, username: 'alice', avatarUrl: null },
      token: 'jwt-token',
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'secret123' })
      .expect(200);
    expect(res.body).toEqual({ user: { id: 1, username: 'alice', avatarUrl: null } });
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/ualgeddit_token=jwt-token/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it('ignores Authorization headers (cookie-only authentication)', async () => {
    const authenticate = vi.spyOn(container.services.auth, 'authenticate');
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer stolen').expect(401);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('resolves the user from the session cookie', async () => {
    signIn();
    vi.spyOn(container.services.auth, 'me').mockResolvedValue({
      id: 1,
      username: 'alice',
      avatarUrl: null,
    });
    await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'ualgeddit_token=whatever')
      .expect(200, { id: 1, username: 'alice', avatarUrl: null });
  });

  it('validates votes and forwards them to the service', async () => {
    signIn();
    const vote = vi
      .spyOn(container.services.posts, 'vote')
      .mockResolvedValue({ score: 3, myVote: 1 });

    await request(app)
      .put('/api/posts/9/vote')
      .set('Cookie', 'ualgeddit_token=t')
      .send({ value: 5 })
      .expect(400);
    await request(app)
      .put('/api/posts/9/vote')
      .set('Cookie', 'ualgeddit_token=t')
      .send({ value: 1 })
      .expect(200, { score: 3, myVote: 1 });
    expect(vote).toHaveBeenCalledWith(9, 1, 1);
  });

  it('rejects non-image uploads by MIME type', async () => {
    signIn();
    await request(app)
      .post('/api/posts')
      .set('Cookie', 'ualgeddit_token=t')
      .field('subgedditId', '1')
      .field('title', 'x')
      .attach('images', Buffer.from('<svg/>'), { filename: 'x.svg', contentType: 'image/svg+xml' })
      .expect(415);
  });

  it('rejects invalid ids', async () => {
    await request(app).get('/api/posts/abc').expect(400);
  });

  it('returns 404 JSON for unknown routes', async () => {
    const { body } = await request(app).get('/api/does-not-exist').expect(404);
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('hides internal errors', async () => {
    vi.spyOn(container.services.posts, 'list').mockRejectedValue(new Error('secret stack'));
    const { body } = await request(app).get('/api/posts').expect(500);
    expect(JSON.stringify(body)).not.toContain('secret');
  });
});
