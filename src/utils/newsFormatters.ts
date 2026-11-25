import type { MediaSourceId, NewsCategory } from '../types/news.ts';

export const CATEGORY_OPTIONS: ReadonlyArray<{ id: NewsCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'nasional', label: 'Nasional' },
  { id: 'ekonomi', label: 'Ekonomi & Bisnis' },
  { id: 'teknologi', label: 'Teknologi' },
  { id: 'olahraga', label: 'Olahraga' },
  { id: 'hiburan', label: 'Hiburan' },
];

export const MEDIA_SOURCE_OPTIONS: ReadonlyArray<{ id: MediaSourceId; label: string }> = [
  { id: 'all', label: 'Semua Media' },
  { id: 'cnn', label: 'CNN Indonesia' },
  { id: 'cnbc', label: 'CNBC Indonesia' },
  { id: 'tempo', label: 'Tempo.co' },
  { id: 'antara', label: 'Antara News' },
  { id: 'detik', label: 'Detik.com' },
  { id: 'republika', label: 'Republika' },
  { id: 'kompas', label: 'Kompas.com' },
];

export function getCategoryLabel(category: NewsCategory): string {
  return CATEGORY_OPTIONS.find((item) => item.id === category)?.label ?? 'Nasional';
}

export function getMediaSourceLabel(source: MediaSourceId): string {
  return MEDIA_SOURCE_OPTIONS.find((item) => item.id === source)?.label ?? 'Semua Media';
}

export function isSafeHttpUrl(raw: string | null | undefined): boolean {
  if (!raw) {
    return false;
  }
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatWibTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export function formatFullIndonesianDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia';
  }
  const formatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(date);
  return `${formatted} WIB`;
}

export function formatRelativeTimeId(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'baru saja';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m lalu`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}j lalu`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'kemarin';
  }
  if (diffDays < 30) {
    return `${diffDays}h lalu`;
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}
