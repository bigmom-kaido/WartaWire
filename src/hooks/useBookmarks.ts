import { useCallback, useEffect, useState } from 'react';
import type { NewsArticle } from '../types/news.ts';

const STORAGE_KEY = 'wartawire_bookmarks_v1';

function readStoredBookmarks(): NewsArticle[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is NewsArticle =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.url === 'string',
    );
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>(() => readStoredBookmarks());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [bookmarks]);

  const isBookmarked = useCallback(
    (id: string): boolean => bookmarks.some((item) => item.id === id),
    [bookmarks],
  );

  const toggleBookmark = useCallback((article: NewsArticle) => {
    setBookmarks((prev) => {
      const exists = prev.some((item) => item.id === article.id);
      if (exists) {
        return prev.filter((item) => item.id !== article.id);
      }
      return [article, ...prev];
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    clearBookmarks,
  };
}
