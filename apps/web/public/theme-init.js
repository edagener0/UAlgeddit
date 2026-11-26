// Applies the saved (or system) colour theme before the first paint to avoid a flash.
try {
  const theme = localStorage.getItem('theme');
  const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
} catch {
  // Storage may be unavailable (private mode); fall back to the light theme.
}
