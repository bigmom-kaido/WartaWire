import { Renew, Search } from '@carbon/icons-react';
import {
  Button,
  Column,
  Content,
  DataTableSkeleton,
  Grid,
  InlineNotification,
  Theme,
  Tile,
} from '@carbon/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArticleModal } from './components/ArticleModal.tsx';
import { BookmarksView } from './components/BookmarksView.tsx';
import { FilterToolbar } from './components/FilterToolbar.tsx';
import type { FeedDisplayMode } from './components/FilterToolbar.tsx';
import { Header } from './components/Header.tsx';
import type { AppView } from './components/Header.tsx';
import { RssSourcesView } from './components/RssSourcesView.tsx';
import { WireDataTable } from './components/WireDataTable.tsx';
import { WireTileGrid } from './components/WireTileGrid.tsx';
import { useBookmarks } from './hooks/useBookmarks.ts';
import type {
  HealthStatusResponse,
  MediaSourceId,
  NewsApiErrorPayload,
  NewsArticle,
  NewsCategory,
  NewsFeedResponse,
} from './types/news.ts';
import { getCategoryLabel, getMediaSourceLabel } from './utils/newsFormatters.ts';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('feed');
  const [displayMode, setDisplayMode] = useState<FeedDisplayMode>('table');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [selectedSource, setSelectedSource] = useState<MediaSourceId>('all');
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const [feedData, setFeedData] = useState<NewsFeedResponse | null>(null);
  const [health, setHealth] = useState<HealthStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorPayload, setErrorPayload] = useState<NewsApiErrorPayload | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { bookmarks, isBookmarked, toggleBookmark, clearBookmarks } = useBookmarks();

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = (await res.json()) as HealthStatusResponse;
        setHealth(data);
      }
    } catch {
      // Ignore transient health check failure
    }
  }, []);

  const fetchNews = useCallback(
    async (category: NewsCategory, source: MediaSourceId, query: string, forceRefresh = false) => {
      setIsLoading(true);
      setErrorPayload(null);

      try {
        const params = new URLSearchParams({ category, source });
        if (query.trim()) {
          params.set('q', query.trim());
        }
        if (forceRefresh) {
          params.set('refresh', 'true');
        }

        const res = await fetch(`/api/news?${params.toString()}`);
        const body = await res.json();

        if (!res.ok) {
          setErrorPayload(body as NewsApiErrorPayload);
          setFeedData(null);
          return;
        }

        setFeedData(body as NewsFeedResponse);
      } catch {
        setErrorPayload({
          errorCode: 'UPSTREAM_ERROR',
          message: 'Tidak dapat terhubung ke server aplikasi. Pastikan server berjalan lalu coba lagi.',
        });
      } finally {
        setIsLoading(false);
        fetchHealth();
      }
    },
    [fetchHealth],
  );

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    fetchNews(selectedCategory, selectedSource, activeQuery, false);
  }, [selectedCategory, selectedSource, activeQuery, fetchNews]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/') {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchInput.trim());
    if (activeView !== 'feed') {
      setActiveView('feed');
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveQuery('');
    if (activeView !== 'feed') {
      setActiveView('feed');
    }
  };

  const handleResetAllFilters = () => {
    setSearchInput('');
    setActiveQuery('');
    setSelectedCategory('all');
    setSelectedSource('all');
  };

  const handleRefresh = () => {
    if (activeView !== 'feed') {
      setActiveView('feed');
    }
    fetchNews(selectedCategory, selectedSource, activeQuery, true);
  };

  const handleSelectMediaFromDirectory = (sourceId: MediaSourceId) => {
    setSelectedSource(sourceId);
    setActiveView('feed');
  };

  const articles = feedData?.articles ?? [];

  return (
    <Theme theme="g10" className="ww-theme-shell">
      <Header
        activeView={activeView}
        onChangeView={setActiveView}
        bookmarkCount={bookmarks.length}
        isRefreshing={isLoading}
        onRefresh={handleRefresh}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        searchInputRef={searchInputRef}
      />

      <Content className="ww-main-content">
        <Grid className="ww-grid-section">
          <Column sm={4} md={8} lg={16}>
            {activeView === 'feed' && (
              <>
                <FilterToolbar
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  selectedSource={selectedSource}
                  onSelectSource={setSelectedSource}
                  onResetAll={handleResetAllFilters}
                  activeQuery={activeQuery}
                  articleCount={articles.length}
                  cached={feedData?.cached}
                  fetchedAt={feedData?.fetchedAt}
                  isLoading={isLoading}
                  displayMode={displayMode}
                  onChangeDisplayMode={setDisplayMode}
                />

                {isLoading ? (
                  <DataTableSkeleton
                    showHeader
                    showToolbar={false}
                    rowCount={10}
                    columnCount={5}
                    headers={[
                      { header: 'Waktu', key: 'time' },
                      { header: 'Berita', key: 'headline' },
                      { header: 'Media', key: 'source' },
                      { header: 'Topik', key: 'topic' },
                      { header: 'Aksi', key: 'actions' },
                    ]}
                  />
                ) : errorPayload ? (
                  <Tile className="ww-empty-tile" style={{ textAlign: 'left' }}>
                    <InlineNotification
                      kind="error"
                      lowContrast
                      hideCloseButton
                      title="Gagal Memuat Feed RSS:"
                      subtitle={errorPayload.message}
                    />
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Button
                        kind="primary"
                        size="md"
                        renderIcon={Renew}
                        onClick={() => fetchNews(selectedCategory, selectedSource, activeQuery, true)}
                      >
                        Coba Lagi
                      </Button>
                      {bookmarks.length > 0 && (
                        <Button
                          kind="secondary"
                          size="md"
                          onClick={() => setActiveView('bookmarks')}
                        >
                          Buka Tersimpan ({bookmarks.length})
                        </Button>
                      )}
                    </div>
                  </Tile>
                ) : articles.length === 0 ? (
                  <Tile className="ww-empty-tile">
                    <Search size={28} style={{ margin: '0 auto 0.75rem', color: 'var(--cds-text-secondary)' }} />
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Tidak ada berita ditemukan</h2>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--cds-text-secondary)',
                        margin: '0.5rem auto 1.25rem',
                        maxWidth: '30rem',
                      }}
                    >
                      {activeQuery
                        ? `Tidak ada artikel yang cocok dengan "${activeQuery}" pada filter saat ini.`
                        : 'Kombinasi topik dan media yang dipilih belum memiliki artikel aktif.'}
                    </p>
                    <Button kind="primary" size="md" onClick={handleResetAllFilters}>
                      Reset Filter
                    </Button>
                  </Tile>
                ) : displayMode === 'table' ? (
                  <WireDataTable
                    title="Arus Berita Indonesia"
                    description={`${getCategoryLabel(selectedCategory)} · ${getMediaSourceLabel(selectedSource)}`}
                    articles={articles}
                    isBookmarked={isBookmarked}
                    onSelectArticle={setSelectedArticle}
                    onToggleBookmark={toggleBookmark}
                  />
                ) : (
                  <WireTileGrid
                    articles={articles}
                    isBookmarked={isBookmarked}
                    onSelectArticle={setSelectedArticle}
                    onToggleBookmark={toggleBookmark}
                  />
                )}
              </>
            )}

            {activeView === 'bookmarks' && (
              <BookmarksView
                bookmarks={bookmarks}
                displayMode={displayMode}
                onChangeDisplayMode={setDisplayMode}
                onSelectArticle={setSelectedArticle}
                onToggleBookmark={toggleBookmark}
                onClearBookmarks={clearBookmarks}
                onBackToFeed={() => setActiveView('feed')}
              />
            )}

            {activeView === 'sources' && (
              <RssSourcesView
                health={health}
                sourceStatuses={feedData?.sourceStatuses ?? []}
                onSelectMedia={handleSelectMediaFromDirectory}
                onBackToFeed={() => setActiveView('feed')}
              />
            )}
          </Column>
        </Grid>
      </Content>

      <footer className="ww-footer">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <div className="ww-footer-inner">
              <span>WartaWire — Agregator RSS Media Indonesia </span>
              <Button kind="ghost" size="sm" onClick={() => setActiveView('sources')}>
                7 Sumber Media Nasional
              </Button>
            </div>
          </Column>
        </Grid>
      </footer>

      <ArticleModal
        article={selectedArticle}
        bookmarked={selectedArticle ? isBookmarked(selectedArticle.id) : false}
        onClose={() => setSelectedArticle(null)}
        onToggleBookmark={toggleBookmark}
      />
    </Theme>
  );
}
