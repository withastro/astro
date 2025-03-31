import { motion } from 'framer-motion'
import Image from 'next/image'

interface Award {
  id: string
  title: string
  organization: string
  date: string
  description: string
  media: {
    id: string
    url: string
    alt_text?: string
    type: 'image'
  }[]
  category: string
  link?: string
}

interface Certification {
  id: string
  name: string
  issuer: string
  validUntil: string
  imageUrl: string
  verificationUrl?: string
}

interface Recognition {
  id: string
  title: string
  source: string
  date: string
  quote: string
  sourceLogoUrl: string
  link?: string
}

interface AwardsShowcaseProps {
  awards?: Award[]
  certifications?: Certification[]
  recognitions?: Recognition[]
  className?: string
}

export function AwardsShowcase({
  awards = [],
  certifications = [],
  recognitions = [],
  className = ''
}: AwardsShowcaseProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Awards Section */}
        {awards.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Awards & Achievements
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {awards.map((award) => (
                <motion.div
                  key={award.id}
                  variants={item}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-center mb-4">
                    <div className="relative h-32 w-32 mx-auto mb-4">
                      <Image
                        src={award.media[0].url}
                        alt={award.media[0].alt_text || `${award.title} award from ${award.organization}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {award.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {award.organization}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full">
                        {award.category}
                      </span>
                      <span className="ml-auto">{award.date}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {award.description}
                    </p>
                    {award.link && (
                      <a
                        href={award.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Learn more
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Certifications
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {certifications.map((cert) => (
                <motion.div
                  key={cert.id}
                  variants={item}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <Image
                      src={cert.imageUrl}
                      alt={cert.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {cert.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {cert.issuer}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    Valid until: {cert.validUntil}
                  </p>
                  {cert.verificationUrl && (
                    <a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Verify
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </a>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Recognitions Section */}
        {recognitions.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Industry Recognition
            </h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {recognitions.map((recognition) => (
                <motion.div
                  key={recognition.id}
                  variants={item}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {recognition.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {recognition.date}
                      </p>
                    </div>
                    <div className="relative w-24 h-8">
                      <Image
                        src={recognition.sourceLogoUrl}
                        alt={recognition.source}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <blockquote className="text-gray-700 dark:text-gray-300 italic mb-4">
                    "{recognition.quote}"
                  </blockquote>
                  {recognition.link && (
                    <a
                      href={recognition.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Read full article
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  )
} 