import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

interface Testimonial {
  id: string
  clientName: string
  companyName: string
  role: string
  media: {
    id: string
    url: string
    alt_text?: string
    type: 'image'
    purpose: 'avatar' | 'company_logo'
  }[]
  quote: string
  projectTitle: string
  results: {
    before: string
    after: string
    metric: string
  }[]
  videoUrl?: string
  caseStudyUrl?: string
}

interface TestimonialsShowcaseProps {
  testimonials: Testimonial[]
  className?: string
}

export function TestimonialsShowcase({ testimonials, className = '' }: TestimonialsShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className={`py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Client Success Stories
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Real results from real clients
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-24 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Previous testimonial"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-24 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Next testimonial"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Testimonial Content */}
          <AnimatePresence mode="wait">
            {testimonials.map((testimonial, index) => (
              index === activeIndex && (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-8 p-8">
                    {/* Left Column - Client Info & Quote */}
                    <div className="space-y-8">
                      {/* Client Info */}
                      <div className="flex items-center space-x-4">
                        <Image
                          src={testimonial.media.find(m => m.purpose === 'avatar')?.url || ''}
                          alt={`${testimonial.clientName}'s avatar`}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{testimonial.clientName}</h3>
                          <div className="flex items-center mt-1">
                            <Image
                              src={testimonial.media.find(m => m.purpose === 'company_logo')?.url || ''}
                              alt={`${testimonial.companyName} logo`}
                              width={20}
                              height={20}
                              className="mr-2"
                            />
                            <p className="text-sm text-gray-600">
                              {testimonial.role} at {testimonial.companyName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quote */}
                      <blockquote className="text-lg text-gray-700 dark:text-gray-200 italic relative">
                        <svg
                          className="absolute -top-4 -left-4 w-8 h-8 text-blue-500/20"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                        {testimonial.quote}
                      </blockquote>

                      {/* Project Title */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Project: {testimonial.projectTitle}
                        </h4>
                      </div>
                    </div>

                    {/* Right Column - Results & Media */}
                    <div className="space-y-8">
                      {/* Results Grid */}
                      <div className="grid grid-cols-1 gap-6">
                        {testimonial.results.map((result, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Before
                              </span>
                              <svg
                                className="w-5 h-5 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                              </svg>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                After
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                                {result.before}
                              </span>
                              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {result.after}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {result.metric}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Video or Case Study Links */}
                      <div className="flex flex-col space-y-4">
                        {testimonial.videoUrl && (
                          <a
                            href={testimonial.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Watch Success Story
                          </a>
                        )}
                        {testimonial.caseStudyUrl && (
                          <a
                            href={testimonial.caseStudyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Read Case Study
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>

          {/* Testimonial Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === activeIndex
                    ? 'bg-blue-600 dark:bg-blue-400'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                title={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 