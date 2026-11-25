import { Reset } from '@carbon/icons-react';
import {
  Button,
  Column,
  Dropdown,
  Grid,
  Layer,
  Tile,
} from '@carbon/react';
import type { MediaSourceId, NewsCategory } from '../types/news.ts';
import {
  CATEGORY_OPTIONS,
  MEDIA_SOURCE_OPTIONS,
  formatWibTime,
  getCategoryLabel,
  getMediaSourceLabel,
} from '../utils/newsFormatters.ts';
import { ViewModeSwitcher } from './ViewModeSwitcher.tsx';

export type FeedDisplayMode = 'table' | 'tile';

interface FilterToolbarProps {
  selectedCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
  selectedSource: MediaSourceId;
  onSelectSource: (source: MediaSourceId) => void;
  onResetAll: () => void;
  activeQuery: string;
  articleCount: number;
  cached?: boolean;
  fetchedAt?: string;
  isLoading: boolean;
  displayMode: FeedDisplayMode;
  onChangeDisplayMode: (mode: FeedDisplayMode) => void;
}

export function FilterToolbar({
  selectedCategory,
  onSelectCategory,
  selectedSource,
  onSelectSource,
  onResetAll,
  activeQuery,
  articleCount,
  cached,
  fetchedAt,
  isLoading,
  displayMode,
  onChangeDisplayMode,
}: FilterToolbarProps) {
  const selectedCategoryItem =
    CATEGORY_OPTIONS.find((item) => item.id === selectedCategory) ?? CATEGORY_OPTIONS[0];
  const selectedSourceItem =
    MEDIA_SOURCE_OPTIONS.find((item) => item.id === selectedSource) ?? MEDIA_SOURCE_OPTIONS[0];

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedSource !== 'all' || Boolean(activeQuery);

  return (
    <Tile className="ww-toolbar-tile">
      <Layer level={0}>
        <Grid fullWidth className="ww-toolbar-grid">
          {/* Topic Dropdown */}
          <Column sm={2} md={3} lg={6}>
            <Dropdown
              id="filter-topic-dropdown"
              titleText="Topik"
              label="Pilih topik"
              size="md"
              items={[...CATEGORY_OPTIONS]}
              selectedItem={selectedCategoryItem}
              itemToString={(item) => item?.label ?? ''}
              onChange={({ selectedItem }) => {
                if (selectedItem) {
                  onSelectCategory(selectedItem.id);
                }
              }}
            />
          </Column>

          {/* Media Dropdown */}
          <Column sm={2} md={3} lg={6}>
            <Dropdown
              id="filter-media-dropdown"
              titleText="Media"
              label="Pilih media"
              size="md"
              items={[...MEDIA_SOURCE_OPTIONS]}
              selectedItem={selectedSourceItem}
              itemToString={(item) => item?.label ?? ''}
              onChange={({ selectedItem }) => {
                if (selectedItem) {
                  onSelectSource(selectedItem.id);
                }
              }}
            />
          </Column>

          {/* Compact Icon-Only View Mode Switcher */}
          <Column sm={4} md={2} lg={4}>
            <span className="ww-switcher-label">Tampilan</span>
            <ViewModeSwitcher
              displayMode={displayMode}
              onChangeDisplayMode={onChangeDisplayMode}
            />
          </Column>
        </Grid>
      </Layer>

      {/* Metadata Summary Line */}
      <div className="ww-meta-strip">
        <div>
          {isLoading ? (
            <span>Mengambil feed RSS resmi media Indonesia...</span>
          ) : (
            <span>
              <strong className="ww-tabular">{articleCount} artikel</strong>
              {' · '}
              {getCategoryLabel(selectedCategory)}
              {' · '}
              {getMediaSourceLabel(selectedSource)}
              {activeQuery ? ` · Kueri: "${activeQuery}"` : ''}
              {fetchedAt ? (
                <span className="ww-tabular">
                  {` · Diperbarui ${formatWibTime(fetchedAt)} WIB${cached ? ' (cache)' : ''}`}
                </span>
              ) : null}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hasActiveFilters && (
            <Button kind="ghost" size="sm" renderIcon={Reset} onClick={onResetAll}>
              Reset Filter
            </Button>
          )}
        </div>
      </div>
    </Tile>
  );
}
