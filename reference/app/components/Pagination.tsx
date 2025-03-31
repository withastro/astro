import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
  showFirstLast?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true
}: PaginationProps) {
  const range = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const getPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3
    const totalBlocks = totalNumbers + 2

    if (totalPages <= totalBlocks) {
      return range(1, totalPages)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      return [...range(1, leftItemCount), -1, totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      return [1, -1, ...range(totalPages - rightItemCount + 1, totalPages)]
    }

    return [
      1,
      -1,
      ...range(leftSiblingIndex, rightSiblingIndex),
      -1,
      totalPages
    ]
  }

  return (
    <nav className="flex items-center justify-center space-x-1">
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`
            p-2 rounded-md
            ${currentPage === 1
              ? 'text-muted-foreground cursor-not-allowed'
              : 'hover:bg-muted'
            }
          `}
        >
          <ChevronLeft className="h-4 w-4" />
          <ChevronLeft className="h-4 w-4 -ml-2" />
        </button>
      )}

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          p-2 rounded-md
          ${currentPage === 1
            ? 'text-muted-foreground cursor-not-allowed'
            : 'hover:bg-muted'
          }
        `}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center space-x-1">
        {getPageNumbers().map((pageNumber, i) => (
          pageNumber === -1 ? (
            <MoreHorizontal
              key={`dots-${i}`}
              className="h-4 w-4 text-muted-foreground"
            />
          ) : (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`
                min-w-[2rem] h-8 rounded-md text-sm
                ${pageNumber === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
                }
              `}
            >
              {pageNumber}
            </button>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          p-2 rounded-md
          ${currentPage === totalPages
            ? 'text-muted-foreground cursor-not-allowed'
            : 'hover:bg-muted'
          }
        `}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`
            p-2 rounded-md
            ${currentPage === totalPages
              ? 'text-muted-foreground cursor-not-allowed'
              : 'hover:bg-muted'
            }
          `}
        >
          <ChevronRight className="h-4 w-4" />
          <ChevronRight className="h-4 w-4 -ml-2" />
        </button>
      )}
    </nav>
  )
} 