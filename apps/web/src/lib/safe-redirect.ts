/**
 * Returns `target` only if it is an internal path of this app, otherwise `fallback`.
 * Rejects protocol-relative (`//evil.com`), backslash (`/\\evil.com`) and absolute URLs,
 * so the post-login redirect can never be turned into an open redirect.
 */
export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string') return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\'))
    return fallback;
  try {
    const url = new URL(target, window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
