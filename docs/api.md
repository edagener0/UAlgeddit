# API

The complete, interactive reference is generated from the code and served by the API:

- **Swagger UI**: `http://localhost:3000/api/docs` (dev) or `http://localhost:8080/api/docs` (Docker)
- **OpenAPI 3.1 JSON**: `/api/docs/openapi.json`

All endpoints live under `/api`, accept and return JSON (except uploads, which are `multipart/form-data`).

## Authentication

Authentication uses a **session cookie only**:

1. `POST /api/auth/register` or `POST /api/auth/login` responds with `{ "user": … }` and a
   `Set-Cookie: ualgeddit_token=…; HttpOnly; SameSite=Lax; Path=/` header (`Secure` when `COOKIE_SECURE=true`).
2. The browser sends the cookie automatically on every request, including the WebSocket upgrade.
3. `POST /api/auth/logout` clears the cookie and revokes every session of the user.

The token is never part of a response body and `Authorization` headers are ignored. Browsing (feeds, posts,
profiles, communities) is public; writing requires a session. State-changing requests from origins that are not in
`CORS_ORIGINS` are rejected with `403`.

## Endpoints

| Method | Path                                       | Auth | Description                                                 |
| ------ | ------------------------------------------ | :--: | ----------------------------------------------------------- |
| POST   | `/auth/register`                           |      | Create an account and sign in                               |
| POST   | `/auth/login`                              |      | Sign in                                                     |
| POST   | `/auth/logout`                             |      | Sign out (revokes all sessions)                             |
| GET    | `/auth/me`                                 |  ✓   | Current user                                                |
| GET    | `/users/{username}`                        |      | Profile (+ friendship status for the viewer)                |
| PATCH  | `/users/me`                                |  ✓   | Update bio / birthday                                       |
| PUT    | `/users/me/avatar`                         |  ✓   | Upload avatar (`avatar` file)                               |
| DELETE | `/users/me/avatar`                         |  ✓   | Remove avatar                                               |
| GET    | `/subgeddits?q=&page=&pageSize=`           |      | List / search communities                                   |
| POST   | `/subgeddits`                              |  ✓   | Create (`name`, `description`, `icon`, `banner`)            |
| GET    | `/subgeddits/{name}`                       |      | Community details                                           |
| PATCH  | `/subgeddits/{name}`                       |  ✓   | Update (owner only)                                         |
| DELETE | `/subgeddits/{name}`                       |  ✓   | Delete with all posts (owner only)                          |
| GET    | `/posts?sort=&subgeddit=&author=&q=&page=` |      | Feed (`hot`, `new`, `top`)                                  |
| POST   | `/posts`                                   |  ✓   | Create (`subgedditId`, `title`, `content`, `images[]` ≤ 10) |
| GET    | `/posts/{id}`                              |      | Post details                                                |
| PATCH  | `/posts/{id}`                              |  ✓   | Edit title / content (author only)                          |
| DELETE | `/posts/{id}`                              |  ✓   | Delete (author only)                                        |
| PUT    | `/posts/{id}/vote`                         |  ✓   | `{ "value": 1 \| 0 \| -1 }`                                 |
| GET    | `/posts/{id}/comments?sort=top\|new\|old`  |      | Nested comment tree                                         |
| POST   | `/posts/{id}/comments`                     |  ✓   | Comment / reply (`content`, `parentId`, `images[]` ≤ 4)     |
| DELETE | `/comments/{id}`                           |  ✓   | Soft delete (author only)                                   |
| PUT    | `/comments/{id}/vote`                      |  ✓   | `{ "value": 1 \| 0 \| -1 }`                                 |
| GET    | `/friends`                                 |  ✓   | My friends                                                  |
| GET    | `/friends/requests`                        |  ✓   | `{ received, sent }`                                        |
| POST   | `/friends/requests`                        |  ✓   | `{ "username" }`; auto-accepts a reverse request            |
| POST   | `/friends/requests/{userId}/accept`        |  ✓   | Accept                                                      |
| DELETE | `/friends/requests/received/{userId}`      |  ✓   | Decline                                                     |
| DELETE | `/friends/requests/sent/{userId}`          |  ✓   | Cancel                                                      |
| DELETE | `/friends/{userId}`                        |  ✓   | Unfriend                                                    |
| GET    | `/chat/messages?limit=`                    |  ✓   | Recent chat history (oldest first)                          |
| GET    | `/health`                                  |      | Liveness / database check                                   |

## Pagination

List endpoints accept `page` (≥ 1) and `pageSize` (1–100, default 20) and return:

```json
{ "items": [], "page": 1, "pageSize": 20, "total": 0, "totalPages": 1 }
```

## Errors

Every error has the same shape and an appropriate HTTP status:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "path": "title", "message": "Title is required" }]
  }
}
```

| Status | `code`                            | When                                       |
| ------ | --------------------------------- | ------------------------------------------ |
| 400    | `VALIDATION_ERROR`, `BAD_REQUEST` | Invalid input, malformed JSON              |
| 401    | `UNAUTHORIZED`                    | Missing, invalid or revoked session        |
| 403    | `FORBIDDEN`                       | Not the owner/author, foreign origin       |
| 404    | `NOT_FOUND`, `ROUTE_NOT_FOUND`    | Unknown resource or route                  |
| 409    | `CONFLICT`                        | Duplicate username/community, friendship   |
| 413    | `PAYLOAD_TOO_LARGE`               | Image > 5 MiB or body too large            |
| 415    | `UNSUPPORTED_MEDIA_TYPE`          | Not a JPEG/PNG/GIF/WebP image              |
| 429    | `TOO_MANY_REQUESTS`               | Rate limit exceeded                        |
| 500    | `INTERNAL_SERVER_ERROR`           | Unexpected error (details are logged only) |

The web client translates the English `message`/`details` into the user's language.

## Chat WebSocket

Connect to `ws(s)://<host>/api/chat/ws` with the session cookie. All frames are JSON.

| Direction       | Event                                                       |
| --------------- | ----------------------------------------------------------- |
| client → server | `{ "type": "message", "content": "Hello!" }` (1–1000 chars) |
| server → client | `{ "type": "message", "data": ChatMessage }`                |
| server → client | `{ "type": "presence", "online": 3 }`                       |
| server → client | `{ "type": "error", "message": "…" }`                       |

Unauthenticated upgrades get `401`, foreign origins `403`. Each connection may send 5 messages per 5 seconds.
