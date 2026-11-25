import { ArrowLeft, Bookmark, Close, TrashCan } from '@carbon/icons-react';
import { Button, Layer, TextInput, Tile } from '@carbon/react';
import { useMemo, useState } from 'react';
import type { NewsArticle } from '../types/news.ts';
import type { FeedDisplayMode } from './FilterToolbar.tsx';
import { ViewModeSwitcher } from './ViewModeSwitcher.tsx';
import { WireDataTable } from './WireDataTable.tsx';
import { WireTileGrid } from './WireTileGrid.tsx';

interface BookmarksViewProps {
  bookmarks: NewsArticle[];
  displayMode: FeedDisplayMode;
  onChangeDisplayMode: (mode: FeedDisplayMode) => void;
  onSelectArticle: (article: NewsArticle) => void;
  onToggleBookmark: (article: NewsArticle) => void;
  onClearBookmarks: () => void;
  onBackToFeed: () => void;
}

export function BookmarksView({
  bookmarks,
  displayMode,
  onChangeDisplayMode,
  onSelectArticle,
  onToggleBookmark,
  onClearBookmarks,
  onBackToFeed,
}: BookmarksViewProps) {
  const [localFilter, setLocalFilter] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = localFilter.trim().toLowerCase();
    if (!q) {
      return bookmarks;
    }
    return bookmarks.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.sourceName.toLowerCase().includes(q),
    );
  }, [bookmarks, localFilter]);

  return (
    <div>
      <Tile className="ww-toolbar-tile">
        <div className="ww-search-row" style={{ marginBottom: bookmarks.length > 0 ? '1rem' : 0 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Daftar Bacaan Tersimpan</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
              <span className="ww-tabular">{bookmarks.length} artikel</span> disimpan secara lokal di browser Anda.
            </p>
          </div>

          <div className="ww-table-actions" style={{ gap: '0.5rem' }}>
            {bookmarks.length > 0 && !confirmClear && (
              <Button
                kind="danger--ghost"
                size="md"
                renderIcon={TrashCan}
                onClick={() => setConfirmClear(true)}
              >
                Kosongkan
              </Button>
            )}
            {confirmClear && (
              <>
                <Button
                  kind="danger"
                  size="md"
                  onClick={() => {
                    onClearBookmarks();
                    setConfirmClear(false);
                  }}
                >
                  Hapus Semua
                </Button>
                <Button kind="secondary" size="md" onClick={() => setConfirmClear(false)}>
                  Batal
                </Button>
              </>
            )}
            <Button kind="tertiary" size="md" renderIcon={ArrowLeft} onClick={onBackToFeed}>
              Kembali ke Berita
            </Button>
          </div>
        </div>

        {bookmarks.length > 0 && (
          <Layer level={0}>
            <div className="ww-search-row" style={{ marginBottom: 0 }}>
              <div className="ww-search-form">
                <div className="ww-search-input-wrap">
                  <TextInput
                    id="bookmark-filter-input"
                    labelText="Saring artikel tersimpan"
                    hideLabel
                    size="md"
                    value={localFilter}
                    onChange={(e) => setLocalFilter(e.target.value)}
                    placeholder="Saring judul, deskripsi, atau nama media..."
                  />
                </div>
                {localFilter && (
                  <Button
                    kind="ghost"
                    size="md"
                    hasIconOnly
                    renderIcon={Close}
                    iconDescription="Reset saringan"
                    onClick={() => setLocalFilter('')}
                  />
                )}
              </div>

              <div>
                <ViewModeSwitcher
                  displayMode={displayMode}
                  onChangeDisplayMode={onChangeDisplayMode}
                />
              </div>
            </div>
          </Layer>
        )}
      </Tile>

      {bookmarks.length === 0 ? (
        <Tile className="ww-empty-tile">
          <Bookmark size={28} style={{ margin: '0 auto 0.75rem', color: 'var(--cds-text-secondary)' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Belum ada artikel tersimpan</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', margin: '0.5rem auto 1.25rem', maxWidth: '28rem' }}>
            Klik ikon bookmark pada tabel atau kartu berita untuk menyimpannya ke daftar bacaan ini.
          </p>
          <Button kind="primary" size="md" renderIcon={ArrowLeft} onClick={onBackToFeed}>
            Jelajahi Berita Utama
          </Button>
        </Tile>
      ) : filtered.length === 0 ? (
        <Tile className="ww-empty-tile">
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
            Tidak ada artikel tersimpan yang cocok dengan "{localFilter}".
          </p>
          <Button kind="tertiary" size="sm" onClick={() => setLocalFilter('')}>
            Reset Saringan
          </Button>
        </Tile>
      ) : displayMode === 'table' ? (
        <WireDataTable
          title="Artikel Tersimpan"
          description="Menampilkan daftar bacaan lokal Anda dalam format Carbon DataTable."
          articles={filtered}
          isBookmarked={() => true}
          onSelectArticle={onSelectArticle}
          onToggleBookmark={onToggleBookmark}
        />
      ) : (
        <WireTileGrid
          articles={filtered}
          isBookmarked={() => true}
          onSelectArticle={onSelectArticle}
          onToggleBookmark={onToggleBookmark}
        />
      )}
    </div>
  );
}
