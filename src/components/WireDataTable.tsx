import { Bookmark, BookmarkFilled, Launch } from '@carbon/icons-react';
import {
  Button,
  DataTable,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { useEffect, useState } from 'react';
import type { NewsArticle } from '../types/news.ts';
import {
  formatRelativeTimeId,
  formatWibTime,
  getCategoryLabel,
  isSafeHttpUrl,
} from '../utils/newsFormatters.ts';

interface WireDataTableProps {
  title: string;
  description: string;
  articles: NewsArticle[];
  isBookmarked: (id: string) => boolean;
  onSelectArticle: (article: NewsArticle) => void;
  onToggleBookmark: (article: NewsArticle) => void;
}

const HEADERS = [
  { key: 'time', header: 'Waktu' },
  { key: 'headline', header: 'Berita' },
  { key: 'source', header: 'Media' },
  { key: 'topic', header: 'Topik' },
  { key: 'actions', header: 'Aksi' },
];

export function WireDataTable({
  title,
  description,
  articles,
  isBookmarked,
  onSelectArticle,
  onToggleBookmark,
}: WireDataTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [articles.length, title]);

  const startIndex = (page - 1) * pageSize;
  const pagedArticles = articles.slice(startIndex, startIndex + pageSize);
  const articleMap = new Map(pagedArticles.map((item) => [item.id, item]));

  const rows = pagedArticles.map((article) => ({
    id: article.id,
    time: formatWibTime(article.publishedAt),
    headline: article.title,
    source: article.sourceName,
    topic: getCategoryLabel(article.category),
    actions: article.id,
  }));

  return (
    <div>
      <DataTable rows={rows} headers={HEADERS} isSortable={false} size="md">
        {({ rows: tableRows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer title={title} description={description} {...getTableContainerProps()}>
            <Table {...getTableProps()} aria-label={title}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader
                      {...getHeaderProps({ header })}
                      key={header.key}
                      style={
                        header.key === 'time'
                          ? { width: '108px' }
                          : header.key === 'source'
                            ? { width: '150px' }
                            : header.key === 'topic'
                              ? { width: '136px' }
                              : header.key === 'actions'
                                ? { width: '96px' }
                                : undefined
                      }
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => {
                  const article = articleMap.get(row.id);
                  if (!article) {
                    return null;
                  }
                  const saved = isBookmarked(article.id);
                  const safeUrl = isSafeHttpUrl(article.url) ? article.url : null;
                  const { key: _rowKey, ...rowProps } = getRowProps({ row });

                  return (
                    <TableRow key={row.id} {...rowProps}>
                      <TableCell>
                        <div className="ww-tabular" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          {formatWibTime(article.publishedAt)}
                        </div>
                        <div
                          className="ww-tabular"
                          style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)' }}
                        >
                          {formatRelativeTimeId(article.publishedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="ww-headline-btn"
                          onClick={() => onSelectArticle(article)}
                        >
                          {article.title}
                        </button>
                        {article.description && (
                          <div className="ww-snippet">{article.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 500 }}>{article.sourceName}</span>
                      </TableCell>
                      <TableCell>{getCategoryLabel(article.category)}</TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      {articles.length > 15 && (
        <Pagination
          backwardText="Halaman sebelumnya"
          forwardText="Halaman berikutnya"
          itemsPerPageText="Artikel per halaman:"
          page={page}
          pageSize={pageSize}
          pageSizes={[15, 20, 40, 80]}
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
