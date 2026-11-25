import { Renew } from '@carbon/icons-react';
import {
  Header as CarbonHeader,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  HeaderSideNavItems,
  Search,
  SideNav,
  SideNavItems,
  Theme,
} from '@carbon/react';
import { useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { WartaWireLogo } from './WartaWireLogo.tsx';

export type AppView = 'feed' | 'bookmarks' | 'sources';

interface HeaderProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  bookmarkCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (e: FormEvent) => void;
  onClearSearch: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function Header({
  activeView,
  onChangeView,
  bookmarkCount,
  isRefreshing,
  onRefresh,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  searchInputRef,
}: HeaderProps) {
  const [isSideNavExpanded, setIsSideNavExpanded] = useState(false);

  const navigate = (view: AppView) => {
    onChangeView(view);
    setIsSideNavExpanded(false);
  };

  return (
    <CarbonHeader aria-label="WartaWire">
      <HeaderMenuButton
        aria-label={isSideNavExpanded ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        onClick={() => setIsSideNavExpanded((prev) => !prev)}
        isActive={isSideNavExpanded}
      />
      <HeaderName
        href="#berita"
        prefix=""
        onClick={(e) => {
          e.preventDefault();
          navigate('feed');
        }}
      >
        <span className="ww-header-brand">
          <WartaWireLogo size={22} variant="on-dark" />
          <span>WartaWire</span>
        </span>
      </HeaderName>

      <HeaderNavigation aria-label="Navigasi utama">
        <HeaderMenuItem
          href="#berita"
          isCurrentPage={activeView === 'feed'}
          onClick={(e) => {
            e.preventDefault();
            navigate('feed');
          }}
        >
          Berita Utama
        </HeaderMenuItem>
        <HeaderMenuItem
          href="#tersimpan"
          isCurrentPage={activeView === 'bookmarks'}
          onClick={(e) => {
            e.preventDefault();
            navigate('bookmarks');
          }}
        >
          Tersimpan ({bookmarkCount})
        </HeaderMenuItem>
        <HeaderMenuItem
          href="#sumber-rss"
          isCurrentPage={activeView === 'sources'}
          onClick={(e) => {
            e.preventDefault();
            navigate('sources');
          }}
        >
          Sumber RSS
        </HeaderMenuItem>
      </HeaderNavigation>

      <HeaderGlobalBar>
        <Theme theme="g10" as="div" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <form onSubmit={onSearchSubmit} className="ww-header-search-form" role="search">
            <Search
              ref={searchInputRef}
              id="header-news-search"
              size="sm"
              className="ww-header-search"
              labelText="Cari berita Indonesia"
              closeButtonLabelText="Hapus pencarian"
              placeholder="Cari berita..."
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onClear={onClearSearch}
            />
          </form>
        </Theme>

        <HeaderGlobalAction
          aria-label="Muat ulang berita"
          tooltipAlignment="end"
          onClick={() => {
            if (!isRefreshing) {
              onRefresh();
            }
          }}
        >
          <Renew size={20} />
        </HeaderGlobalAction>
      </HeaderGlobalBar>

      <SideNav
        aria-label="Navigasi seluler"
        expanded={isSideNavExpanded}
        isPersistent={false}
        onOverlayClick={() => setIsSideNavExpanded(false)}
      >
        <SideNavItems>
          <HeaderSideNavItems>
            <HeaderMenuItem
              href="#berita"
              isCurrentPage={activeView === 'feed'}
              onClick={(e) => {
                e.preventDefault();
                navigate('feed');
              }}
            >
              Berita Utama
            </HeaderMenuItem>
            <HeaderMenuItem
              href="#tersimpan"
              isCurrentPage={activeView === 'bookmarks'}
              onClick={(e) => {
                e.preventDefault();
                navigate('bookmarks');
              }}
            >
              Tersimpan ({bookmarkCount})
            </HeaderMenuItem>
            <HeaderMenuItem
              href="#sumber-rss"
              isCurrentPage={activeView === 'sources'}
              onClick={(e) => {
                e.preventDefault();
                navigate('sources');
              }}
            >
              Sumber RSS
            </HeaderMenuItem>
          </HeaderSideNavItems>
        </SideNavItems>
      </SideNav>
    </CarbonHeader>
  );
}
