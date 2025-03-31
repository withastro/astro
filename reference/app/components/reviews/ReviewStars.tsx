import Script from 'next/script'

interface ReviewStarsProps {
  rating: number
  maxRating?: number
  totalReviews?: number
  reviewCount?: number
  itemName?: string
  itemType?: string
  className?: string
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  structuredData?: boolean
}

export function ReviewStars({
  rating,
  maxRating = 5,
  totalReviews,
  reviewCount,
  itemName,
  itemType = 'Product',
  className = '',
  showCount = true,
  size = 'md',
  structuredData = true
}: ReviewStarsProps) {
  // Ensure rating is between 0 and maxRating
  const normalizedRating = Math.max(0, Math.min(rating, maxRating))
  
  // Calculate percentage fill for stars
  const percentage = (normalizedRating / maxRating) * 100

  // Generate star sizes based on the size prop
  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  // Generate structured data for rich results
  const generateReviewSchema = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'AggregateRating',
      itemReviewed: {
        '@type': itemType,
        name: itemName
      },
      ratingValue: rating.toFixed(1),
      bestRating: maxRating,
      ratingCount: reviewCount,
      reviewCount: totalReviews,
    }
  }

  return (
    <div className={`flex items-center ${className}`}>
      {structuredData && itemName && (
        <Script
          id="review-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateReviewSchema())
          }}
        />
      )}

      <div className="relative inline-flex">
        {/* Background stars (empty) */}
        <div className="flex">
          {[...Array(maxRating)].map((_, i) => (
            <svg
              key={`empty-${i}`}
              className={`${starSizes[size]} text-gray-300 dark:text-gray-600`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Filled stars (overlay) */}
        <div 
          className={`absolute top-0 left-0 overflow-hidden w-[${percentage}%]`}
        >
          <div className="flex">
            {[...Array(maxRating)].map((_, i) => (
              <svg
                key={`filled-${i}`}
                className={`${starSizes[size]} text-yellow-400`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {showCount && (
        <div className={`ml-2 ${textSizes[size]} text-gray-700 dark:text-gray-300 flex items-center`}>
          <span className="font-medium">{rating.toFixed(1)}</span>
          {totalReviews && (
            <>
              <span className="mx-1">/</span>
              <span>{maxRating}</span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">
                ({totalReviews.toLocaleString()} {totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
} 