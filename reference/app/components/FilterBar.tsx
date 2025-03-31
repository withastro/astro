import { Filter, Search, SortAsc, SortDesc, X } from "lucide-react"

interface FilterOption {
  id: string
  label: string
  value: string
  type: 'checkbox' | 'radio' | 'select'
  options?: { label: string; value: string }[]
}

interface SortOption {
  label: string
  value: string
}

interface FilterBarProps {
  searchPlaceholder?: string
  filterOptions?: FilterOption[]
  sortOptions?: SortOption[]
  selectedFilters: Record<string, string[]>
  sortDirection?: 'asc' | 'desc'
  selectedSort?: string
  onSearch?: (value: string) => void
  onFilterChange?: (filterId: string, values: string[]) => void
  onSortChange?: (value: string) => void
  onSortDirectionChange?: (direction: 'asc' | 'desc') => void
  onClearFilters?: () => void
}

export function FilterBar({
  searchPlaceholder = "Search...",
  filterOptions = [],
  sortOptions = [],
  selectedFilters,
  sortDirection = 'asc',
  selectedSort,
  onSearch,
  onFilterChange,
  onSortChange,
  onSortDirectionChange,
  onClearFilters
}: FilterBarProps) {
  const hasActiveFilters = Object.values(selectedFilters).some(values => values.length > 0)

  return (
    <div className="bg-background border rounded-lg p-4">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full rounded-md border pl-9 pr-4 py-2 text-sm"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button className="flex items-center space-x-1 rounded-md border px-3 py-2 text-sm">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            {/* Filter dropdown would go here */}
          </div>

          {/* Sort */}
          {sortOptions.length > 0 && (
            <div className="flex items-center space-x-2">
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={selectedSort}
                onChange={(e) => onSortChange?.(e.target.value)}
              >
                <option value="">Sort by</option>
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onSortDirectionChange?.(
                  sortDirection === 'asc' ? 'desc' : 'asc'
                )}
                className="rounded-md border p-2"
              >
                {sortDirection === 'asc' ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center space-x-1 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([filterId, values]) => (
            values.map(value => {
              const filter = filterOptions.find(f => f.id === filterId)
              const option = filter?.options?.find(o => o.value === value)
              return filter && (
                <div
                  key={`${filterId}-${value}`}
                  className="flex items-center space-x-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                >
                  <span>{filter.label}: {option?.label || value}</span>
                  <button
                    onClick={() => onFilterChange?.(
                      filterId,
                      values.filter(v => v !== value)
                    )}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })
          ))}
        </div>
      )}
    </div>
  )
} 