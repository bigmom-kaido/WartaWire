import { Grid as GridIcon, TableSplit } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import type { FeedDisplayMode } from './FilterToolbar.tsx';

interface ViewModeSwitcherProps {
  displayMode: FeedDisplayMode;
  onChangeDisplayMode: (mode: FeedDisplayMode) => void;
}

export function ViewModeSwitcher({
  displayMode,
  onChangeDisplayMode,
}: ViewModeSwitcherProps) {
  const isTable = displayMode === 'table';
  const isTile = displayMode === 'tile';

  return (
    <div className="ww-view-toggle-group" role="group" aria-label="Pilih mode tampilan">
      <Button
        kind="ghost"
        size="md"
        hasIconOnly
        renderIcon={TableSplit}
        iconDescription="Tampilan DataTable"
        tooltipPosition="bottom"
        aria-pressed={isTable}
        className={`ww-view-btn ${isTable ? 'ww-view-btn--active' : ''}`}
        onClick={() => onChangeDisplayMode('table')}
      />
      <Button
        kind="ghost"
        size="md"
        hasIconOnly
        renderIcon={GridIcon}
        iconDescription="Tampilan Tile"
        tooltipPosition="bottom"
        aria-pressed={isTile}
        className={`ww-view-btn ${isTile ? 'ww-view-btn--active' : ''}`}
        onClick={() => onChangeDisplayMode('tile')}
      />
    </div>
  );
}
