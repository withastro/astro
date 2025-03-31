import { AnimatePresence, motion } from 'framer-motion'
import Script from 'next/script'
import { useState } from 'react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
}

interface FAQSectionProps {
  faqs: FAQItem[]
  title?: string
  description?: string
  className?: string
  structuredData?: boolean
}

export function FAQSection({
  faqs,
  title = 'Frequently Asked Questions',
  description,
  className = '',
  structuredData = true
}: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  // Generate FAQ Schema
  const generateFAQSchema = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }
  }

  // Group FAQs by category if categories exist
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(faq)
    return acc
  }, {} as Record<string, FAQItem[]>)

  return (
    <section 
      className={`py-12 ${className}`}
      aria-labelledby="faq-title"
    >
      {structuredData && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQSchema())
          }}
        />
      )}

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 
            id="faq-title"
            className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4"
          >
            {title}
          </h2>
          
          {description && (
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              {description}
            </p>
          )}

          <div className="space-y-8">
            {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
              <div key={category} className="space-y-4">
                {Object.keys(groupedFaqs).length > 1 && (
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    {category}
                  </h3>
                )}

                <div className="space-y-4">
                  {categoryFaqs.map(faq => (
                    <div
                      key={faq.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      <button
                        onClick={() => toggleItem(faq.id)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                        aria-expanded={openItems.includes(faq.id)}
                        aria-controls={`faq-answer-${faq.id}`}
                      >
                        <span className="text-gray-900 dark:text-white font-medium">
                          {faq.question}
                        </span>
                        <motion.svg
                          animate={{
                            rotate: openItems.includes(faq.id) ? 180 : 0
                          }}
                          className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </motion.svg>
                      </button>

                      <AnimatePresence>
                        {openItems.includes(faq.id) && (
                          <motion.div
                            id={`faq-answer-${faq.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div 
                              className="px-6 pb-4 prose dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: faq.answer }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 