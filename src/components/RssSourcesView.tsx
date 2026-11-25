import { ArrowLeft, CheckmarkFilled, Rss, WarningAlt } from '@carbon/icons-react';
import {
  Button,
  DataTable,
  InlineNotification,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tile,
} from '@carbon/react';
import type { HealthStatusResponse, MediaSourceId, SourceFetchStatus } from '../types/news.ts';

interface RssSourcesViewProps {
  health: HealthStatusResponse | null;
  sourceStatuses: SourceFetchStatus[];
  onSelectMedia: (sourceId: MediaSourceId) => void;
  onBackToFeed: () => void;
}

const SOURCE_DIRECTORY: ReadonlyArray<{
  id: Exclude<MediaSourceId, 'all'>;
  name: string;
  domain: string;
  method: string;
  notes: string;
}> = [
  {
    id: 'cnn',
    name: 'CNN Indonesia',
    domain: 'cnnindonesia.com',
    method: 'Direct RSS',
    notes: 'Nasional, Ekonomi, Teknologi, Olahraga, dan Hiburan.',
  },
  {
    id: 'cnbc',
    name: 'CNBC Indonesia',
    domain: 'cnbcindonesia.com',
    method: 'Direct RSS',
    notes: 'News, Market (Ekonomi & Bisnis), dan Tech.',
  },
  {
    id: 'tempo',
    name: 'Tempo.co',
    domain: 'tempo.co',
    method: 'Direct RSS + Google News ID',
    notes: 'Feed langsung Nasional & Bisnis; Google News RSS untuk Tekno, Olahraga, Hiburan.',
  },
  {
    id: 'antara',
    name: 'Antara News',
    domain: 'antaranews.com',
    method: 'Direct RSS',
    notes: 'Nasional, Ekonomi, Tekno, Olahraga, dan Hiburan.',
  },
  {
    id: 'detik',
    name: 'Detik.com',
    domain: 'detik.com',
    method: 'Direct RSS',
    notes: 'DetikNews, DetikFinance, DetikInet, DetikSport, dan DetikHot.',
  },
  {
    id: 'republika',
    name: 'Republika',
    domain: 'republika.co.id',
    method: 'Direct RSS + Google News ID',
    notes: 'Nasional, Ekonomi, Leisure; Google News RSS untuk Teknologi & Olahraga.',
  },
  {
    id: 'kompas',
    name: 'Kompas.com',
    domain: 'kompas.com',
    method: 'Google News RSS (ID)',
    notes: 'Ditarik via Google News RSS site:kompas.com (hl=id&gl=ID&ceid=ID:id).',
  },
];

const HEADERS = [
  { key: 'name', header: 'Media' },
  { key: 'method', header: 'Metode RSS' },
  { key: 'status', header: 'Status Koneksi' },
  { key: 'action', header: 'Aksi' },
];

export function RssSourcesView({
  health,
  sourceStatuses,
  onSelectMedia,
  onBackToFeed,
}: RssSourcesViewProps) {
  const statusById = new Map(sourceStatuses.map((s) => [s.sourceId, s]));
  const directoryById = new Map(SOURCE_DIRECTORY.map((d) => [d.id, d]));

  const rows = SOURCE_DIRECTORY.map((item) => ({
    id: item.id,
    name: item.name,
    method: item.method,
    status: item.domain,
    action: item.id,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Tile className="ww-toolbar-tile" style={{ marginBottom: 0 }}>
        <div className="ww-search-row" style={{ marginBottom: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Sumber RSS Resmi Media Indonesia</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
              Daftar {health?.totalSources ?? 7} portal berita nasional yang diagregasi langsung oleh server WartaWire tanpa API key.
            </p>
          </div>
          <Button kind="tertiary" size="md" renderIcon={ArrowLeft} onClick={onBackToFeed}>
            Kembali ke Berita
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
          <Rss size={16} style={{ color: 'var(--cds-interactive)' }} />
          <span>
            Cache memori server aktif selama <strong className="ww-tabular">{health?.cacheTtlMinutes ?? 5} menit</strong> untuk mempercepat perpindahan filter.
          </span>
        </div>
      </Tile>

      <DataTable rows={rows} headers={HEADERS} size="md">
        {({ rows: tableRows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer
            title="Direktori Media Nasional"
            description="Pilih salah satu media untuk langsung menyaring berita dari portal tersebut."
            {...getTableContainerProps()}
          >
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader {...getHeaderProps({ header })} key={header.key}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => {
                  const info = directoryById.get(row.id as Exclude<MediaSourceId, 'all'>);
                  if (!info) return null;
                  const live = statusById.get(info.id);
                  const { key: _rowKey, ...rowProps } = getRowProps({ row });

                  return (
                    <TableRow key={row.id} {...rowProps}>
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{info.name}</div>
                        <div className="ww-tabular" style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                          {info.domain}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                          {info.notes}
                        </div>
                      </TableCell>
                      <TableCell>{info.method}</TableCell>
                      <TableCell>
                        {live ? (
                          live.ok ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#198038', fontWeight: 500 }}>
                              <CheckmarkFilled size={16} />
                              <span className="ww-tabular">{live.articleCount} artikel</span>
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#8e6a00' }}>
                              <WarningAlt size={16} />
                              <span>{live.error || 'Timeout'}</span>
                            </span>
                          )
                        ) : (
                          <span style={{ color: 'var(--cds-text-secondary)' }}>Siap digunakan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button kind="tertiary" size="sm" onClick={() => onSelectMedia(info.id)}>
                          Lihat Berita
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      <InlineNotification
        kind="info"
        lowContrast
        hideCloseButton
        title="Keamanan Feed RSS:"
        subtitle="Seluruh URL feed dikunci di allowlist server dan seluruh tag HTML dari XML RSS dibersihkan menjadi teks polos sebelum dirender."
      />
    </div>
  );
}
