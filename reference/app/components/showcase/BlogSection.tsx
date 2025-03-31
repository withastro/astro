import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  imageUrl: string
  category: string
  author: {
    name: string
    avatar: string
  }
  date: string
  readTime: string
  isFeatured?: boolean
}

interface BlogSectionProps {
  posts: BlogPost[]
  className?: string
}

export function BlogSection({ posts, className = '' }: BlogSectionProps) {
  const featuredPost = posts.find((post) => post.isFeatured)
  const regularPosts = posts.filter((post) => !post.isFeatured)

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
        {/* Featured Post */}
        {featuredPost && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={item}
            className="mb-12"
          >
            <div className="grid md:grid-cols-2 gap-8 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-64 md:h-full">
                <Image
                  src={featuredPost.imageUrl}
                  alt={featuredPost.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium mb-4">
                  {featuredPost.category}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Image
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {featuredPost.author.name}
                      </p>
                      <div className="flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{featuredPost.date}</span>
                        <span>·</span>
                        <span>{featuredPost.readTime} read</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${featuredPost.id}`}
                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Read more
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular Posts Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {regularPosts.map((post) => (
            <motion.article
              key={post.id}
              variants={item}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-48">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {post.author.name}
                      </p>
                      <div className="flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{post.date}</span>
                        <span>·</span>
                        <span>{post.readTime} read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                href={`/blog/${post.id}`}
                className="block p-4 text-center text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Read more
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 