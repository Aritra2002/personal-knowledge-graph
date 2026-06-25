import React from 'react';
import { Search, X } from 'lucide-react';
import type { Note, Category } from '../db';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  notes: Note[];
  categories: Category[];
  isOpen?: boolean;
  onClose?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  notes,
  categories,
  isOpen = true,
  onClose
}) => {
  // Extract all unique tags across all notes
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          if (tag.trim()) tagsSet.add(tag.trim());
        });
      }
    });
    return Array.from(tagsSet);
  }, [notes]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  return (
    <div className={`search-filter-panel glass-panel ${isOpen ? 'open' : 'closed'}`} id="search-filter-panel-root">
      {/* Header and Close button */}
      <div className="search-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9rem' }}>Search & Filter</span>
        {onClose && (
          <button className="icon-only-btn" onClick={onClose} aria-label="Close search panel" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="search-bar-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          id="graph-search-input"
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes, tags, content..."
        />
        {searchQuery && (
          <button className="clear-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Legend & Categories */}
      <div className="category-legend">
        {categories.map(cat => (
          <div key={cat.id} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: cat.color }}></span>
            <span>{cat.label}</span>
          </div>
        ))}
      </div>

      {/* Tag Cloud */}
      {allTags.length > 0 && (
        <div className="tag-cloud">
          <h4>Filter by Tags:</h4>
          <div className="tags-container">
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  className={`tag-filter-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear Filters Indicator */}
      {(searchQuery || selectedTags.length > 0) && (
        <button className="clear-filters-btn" onClick={clearAllFilters}>
          Clear active filters
        </button>
      )}
    </div>
  );
};
