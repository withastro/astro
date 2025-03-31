import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface Accomplishment {
  id: string
  year: string
  title: string
  description: string
  metric?: {
    value: string
    label: string
  }
  icon?: React.ReactNode
}

interface AccomplishmentsProps {
  accomplishments: Accomplishment[]
  className?: string
}

export function Accomplishments({ accomplishments, className = '' }: AccomplishmentsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div
          ref={containerRef}
          className="relative"
        >
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 h-full w-0.5 bg-gray-200 dark:bg-gray-700 transform -translate-x-1/2" />

          {/* Timeline items */}
          <div className="space-y-16">
            {accomplishments.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Year marker */}
                <div className="absolute left-4 md:left-1/2 w-8 h-8 bg-blue-500 rounded-full transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>

                {/* Content */}
                <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-16' : 'md:pl-16'}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center mb-4">
                      {item.icon && (
                        <div className="mr-4 text-blue-500 dark:text-blue-400">
                          {item.icon}
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {item.year}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {item.description}
                    </p>

                    {item.metric && (
                      <div className="flex items-center justify-start">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {item.metric.value}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.metric.label}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 