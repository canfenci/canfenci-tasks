import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  onSortChange?: (sort: string) => void;
  filters?: { value: string; label: string }[];
  sorts?: { value: string; label: string }[];
  currentFilter?: string;
  currentSort?: string;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  onFilterChange,
  onSortChange,
  filters = [],
  sorts = [],
  currentFilter,
  currentSort,
  placeholder = 'Ara...',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      onSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleFilterChange = useCallback((filter: string) => {
    onFilterChange?.(filter);
    setShowFilters(false);
  }, [onFilterChange]);

  const handleSortChange = useCallback((sort: string) => {
    onSortChange?.(sort);
  }, [onSortChange]);

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="search-bar-container" style={{ 
      padding: 'var(--space-3) var(--space-4)', 
      background: 'var(--color-bg-elevated)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 'var(--topbar-height)',
      zIndex: 19,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ 
          position: 'relative', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: '12px', 
            color: 'var(--color-text-tertiary)',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="form-input"
            style={{ 
              paddingLeft: '40px',
              paddingRight: query ? '36px' : '12px',
            }}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="top-bar-icon-btn"
              style={{ 
                position: 'absolute', 
                right: '8px',
                padding: '4px',
              }}
              aria-label="Temizle"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="top-bar-icon-btn"
          aria-label={showFilters ? 'Filtreleri kapat' : 'Filtreler'}
          style={{ padding: '8px' }}
        >
          <Filter size={20} />
        </button>

        {sorts.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="top-bar-icon-btn"
              aria-label="Sıralama"
              style={{ padding: '8px' }}
            >
              <ArrowUpDown size={20} />
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <div style={{ 
          marginTop: 'var(--space-2)', 
          paddingTop: 'var(--space-2)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}>
          {filters.length > 0 && (
            <div>
              <label style={{ 
                fontSize: 'var(--font-size-xs)', 
                fontWeight: 600, 
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-1)',
                textTransform: 'uppercase',
              }}>
                Filtre
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleFilterChange('')}
                  className={`tab-chip ${!currentFilter ? 'active' : ''}`}
                  style={{ 
                    background: !currentFilter ? 'var(--color-primary)' : 'var(--color-bg-hover)', 
                    color: !currentFilter ? '#fff' : 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-xs)',
                    padding: '4px 10px',
                  }}
                >
                  Tümü
                </button>
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleFilterChange(filter.value)}
                    className={`tab-chip ${currentFilter === filter.value ? 'active' : ''}`}
                    style={{ 
                      background: currentFilter === filter.value ? 'var(--color-primary)' : 'var(--color-bg-hover)', 
                      color: currentFilter === filter.value ? '#fff' : 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-xs)',
                      padding: '4px 10px',
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sorts.length > 0 && (
            <div>
              <label style={{ 
                fontSize: 'var(--font-size-xs)', 
                fontWeight: 600, 
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-1)',
                textTransform: 'uppercase',
              }}>
                Sırala
              </label>
              <select
                value={currentSort || ''}
                onChange={(e) => handleSortChange(e.target.value)}
                className="form-input"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                <option value="">Varsayılan</option>
                {sorts.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}