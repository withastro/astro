import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

interface UseCase {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  benefits: string[]
  industries: string[]
}

interface UseCasesProps {
  useCases: UseCase[]
  className?: string
}

export function UseCases({ useCases, className = '' }: UseCasesProps) {
  const [activeCase, setActiveCase] = useState<string>(useCases[0]?.id)

  return (
    <section className={`py-16 bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="sticky top-24">
              <nav className="space-y-2">
                {useCases.map((useCase) => (
                  <button
                    key={useCase.id}
                    onClick={() => setActiveCase(useCase.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeCase === useCase.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-6 h-6 mr-3">
                        {useCase.icon}
                      </div>
                      <span className="font-medium">{useCase.title}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            <AnimatePresence mode="wait">
              {useCases.map(
                (useCase) =>
                  activeCase === useCase.id && (
                    <motion.div
                      key={useCase.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg"
                    >
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                        {useCase.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {useCase.description}
                      </p>

                      {/* Benefits */}
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Key Benefits
                        </h4>
                        <ul className="space-y-3">
                          {useCase.benefits.map((benefit, index) => (
                            <li
                              key={index}
                              className="flex items-start text-gray-600 dark:text-gray-300"
                            >
                              <svg
                                className="w-5 h-5 text-green-500 mr-3 mt-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Industries */}
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                          Relevant Industries
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {useCase.industries.map((industry) => (
                            <span
                              key={industry}
                              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm"
                            >
                              {industry}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
} 