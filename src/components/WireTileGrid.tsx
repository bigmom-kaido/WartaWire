import { Bookmark, BookmarkFilled, Launch, Rss } from '@carbon/icons-react';
import { Button, Column, Grid, Pagination, Tile } from '@carbon/react';
import { useEffect, useState } from 'react';
import type { NewsArticle } from '../types/news.ts';
import {
  formatRelativeTimeId,
  formatWibTime,
  getCategoryLabel,
  isSafeHttpUrl,
} from '../utils/newsFormatters.ts';

interface WireTileGridProps {
  articles: NewsArticle[];
  isBookmarked: (id: string) => boolean;
  onSelectArticle: (article: NewsArticle) => void;
  onToggleBookmark: (article: NewsArticle) => void;
}

interface NewsTileItemProps {
  article: NewsArticle;
  saved: boolean;
  onSelect: (article: NewsArticle) => void;
  onToggleBookmark: (article: NewsArticle) => void;
}

function NewsTileItem({ article, saved, onSelect, onToggleBookmark }: NewsTileItemProps) {
  const [imgError, setImgError] = useState(false);
  const safeImage = !imgError && isSafeHttpUrl(article.urlToImage) ? article.urlToImage : null;
  const safeUrl = isSafeHttpUrl(article.url) ? article.url : null;

  return (
    <Tile className="ww-news-tile">
      <div>
        {safeImage ? (
          <div className="ww-tile-media">
            <img
              src={safeImage}
              alt={article.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="ww-tile-fallback" aria-hidden="true">
            <Rss size={20} style={{ marginRight: '0.5rem' }} />
            <span>{article.sourceName}</span>
          </div>
        )}

        <div className="ww-tile-meta">
          <strong style={{ color: 'var(--cds-text-primary)' }}>{article.sourceName}</strong>
          <span aria-hidden="true">·</span>
          <span>{getCategoryLabel(article.category)}</span>
          <span aria-hidden="true">·</span>
          <span className="ww-tabular">
            {formatWibTime(article.publishedAt)} WIB ({formatRelativeTimeId(article.publishedAt)})
          </span>
        </div>

        <button
          type="button"
          className="ww-headline-btn"
          style={{ fontSize: '1.0625rem', lineHeight: 1.35 }}
          onClick={() => onSelect(article)}
        >
          {article.title}
        </button>

        {article.description && <p className="ww-tile-desc">{article.description}</p>}
      </div>

      <div className="ww-tile-footer">
        <Button kind="ghost" size="sm" onClick={() => onSelect(article)}>
          Pratinjau
        </Button>

        <div className="ww-table-actions">
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            renderIcon={saved ? BookmarkFilled : Bookmark}
            iconDescription={saved ? 'Hapus dari tersimpan' : 'Simpan artikel'}
            onClick={() => onToggleBookmark(article)}
          />
          {safeUrl && (
            <Button
              as="a"
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              kind="ghost"
              size="sm"
              hasIconOnly
              renderIcon={Launch}
              iconDescription={`Buka di ${article.sourceName}`}
            />
          )}
        </div>
      </div>
    </Tile>
  );
}

export function WireTileGrid({
  articles,
  isBookmarked,
  onSelectArticle,
  onToggleBookmark,
}: WireTileGridProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);

  useEffect(() => {
    setPage(1);
  }, [articles.length]);

  const startIndex = (page - 1) * pageSize;
  const pagedArticles = articles.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <Grid fullWidth style={{ paddingInline: 0 }}>
        {pagedArticles.map((article) => (
          <Column key={article.id} sm={4} md={4} lg={8} className="ww-tile-col">
            <NewsTileItem
              article={article}
              saved={isBookmarked(article.id)}
              onSelect={onSelectArticle}
              onToggleBookmark={onToggleBookmark}
            />
          </Column>
        ))}
      </Grid>

      {articles.length > 16 && (
        <Pagination
          backwardText="Halaman sebelumnya"
          forwardText="Halaman berikutnya"
          itemsPerPageText="Kartu per halaman:"
          page={page}
          pageSize={pageSize}
          pageSizes={[16, 24, 48, 80]}
          totalItems={articles.length}
          onChange={({ page: nextPage, pageSize: nextPageSize }) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }}
        />
      )}
    </div>
  );
}
