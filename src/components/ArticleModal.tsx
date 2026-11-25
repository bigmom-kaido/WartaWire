import { Bookmark, BookmarkFilled, Launch, Rss } from '@carbon/icons-react';
import { Button, InlineNotification, Modal } from '@carbon/react';
import { useEffect, useState } from 'react';
import type { NewsArticle } from '../types/news.ts';
import {
  formatFullIndonesianDate,
  getCategoryLabel,
  isSafeHttpUrl,
} from '../utils/newsFormatters.ts';

interface ArticleModalProps {
  article: NewsArticle | null;
  bookmarked: boolean;
  onClose: () => void;
  onToggleBookmark: (article: NewsArticle) => void;
}

export function ArticleModal({
  article,
  bookmarked,
  onClose,
  onToggleBookmark,
}: ArticleModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [article?.id]);

  const safeUrl = article && isSafeHttpUrl(article.url) ? article.url : null;
  const safeImage =
    article && !imgError && isSafeHttpUrl(article.urlToImage) ? article.urlToImage : null;

  return (
    <Modal
      open={Boolean(article)}
      onRequestClose={onClose}
      passiveModal
      size="md"
      modalLabel={article ? `${article.sourceName} · ${getCategoryLabel(article.category)}` : ''}
      modalHeading={article?.title ?? ''}
    >
      {article && (
        <div>
          <p
            className="ww-tabular"
            style={{
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
              marginBottom: '1rem',
            }}
          >
            {formatFullIndonesianDate(article.publishedAt)}
            {article.author ? ` · Oleh ${article.author}` : ''}
          </p>

          {safeImage ? (
            <div className="ww-modal-media">
              <img
                src={safeImage}
                alt={article.title}
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

          <div style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--cds-text-primary)' }}>
            {article.description && (
              <p style={{ fontWeight: 500, marginBottom: '0.75rem' }}>{article.description}</p>
            )}
            {article.content && article.content !== article.description && (
              <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
                {article.content}
              </p>
            )}
          </div>

          <InlineNotification
            kind="info"
            lowContrast
            hideCloseButton
            title="Ringkasan RSS:"
            subtitle="Teks diambil langsung dari feed RSS resmi penerbit. Buka situs sumber untuk membaca laporan lengkap."
          />

          <div className="ww-modal-actions">
            <Button
              kind="secondary"
              size="md"
              renderIcon={bookmarked ? BookmarkFilled : Bookmark}
              onClick={() => onToggleBookmark(article)}
            >
              {bookmarked ? 'Hapus dari Tersimpan' : 'Simpan Artikel'}
            </Button>

            {safeUrl && (
              <Button
                as="a"
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                kind="primary"
                size="md"
                renderIcon={Launch}
              >
                Baca di Sumber Asli
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
