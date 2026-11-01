import { useEffect, useState } from 'react';

const STORAGE_KEY = 'folio-theme';

export function readTheme() {
  try { return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'; }
  catch { return 'light'; }
}

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c1020' : '#eff0f3');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Theme still works when storage is unavailable. */ }
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light') };
}
