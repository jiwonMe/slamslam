'use client';

import { useState, useEffect } from 'react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 다크 테마 생성
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

// 서버 사이드 캐시 생성
function createEmotionCache() {
  return createCache({ key: 'mui' });
}

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [{ cache, flush }] = useState(() => {
    const cache = createEmotionCache();
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  // useEffect를 사용하여 클라이언트 사이드에서만 마운트된 것으로 표시
  // 이렇게 하면 hydration 불일치를 방지할 수 있습니다
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        {mounted ? children : null}
      </ThemeProvider>
    </CacheProvider>
  );
} 