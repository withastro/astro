import { relations } from 'drizzle-orm'
import { bigint, index, mysqlTable, text, timestamp, unique, varchar } from 'drizzle-orm/mysql-core'
import { type Locale, type Namespace } from '../i18n/config'

export const translations = mysqlTable('translations', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  locale: varchar('locale', { length: 5 }).notNull().$type<Locale>(),
  namespace: varchar('namespace', { length: 50 }).notNull().$type<Namespace>(),
  key: varchar('key', { length: 255 }).notNull(),
  value: text('value').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  idx_lookup: index('idx_lookup').on(table.locale, table.namespace, table.key),
  unique_translation: unique('unique_translation').on(table.locale, table.namespace, table.key),
}))

// Define parent tables for content types
export const blogs = mysqlTable('blogs', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
})

export const projects = mysqlTable('projects', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
})

export const contentCategories = mysqlTable('content_categories', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
})

export const pages = mysqlTable('pages', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
})

// Define translation tables with localized slugs
export const blogTranslations = mysqlTable('blog_translations', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  blog_id: bigint('blog_id', { mode: 'number' }).notNull(),
  locale: varchar('locale', { length: 5 }).notNull().$type<Locale>(),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  idx_blog_id: index('idx_blog_id').on(table.blog_id),
  idx_locale: index('idx_locale').on(table.locale),
  unique_locale_slug: unique('unique_locale_slug').on(table.locale, table.slug),
}))

export const projectTranslations = mysqlTable('project_translations', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  project_id: bigint('project_id', { mode: 'number' }).notNull(),
  locale: varchar('locale', { length: 5 }).notNull().$type<Locale>(),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  idx_project_id: index('idx_project_id').on(table.project_id),
  idx_locale: index('idx_locale').on(table.locale),
  unique_locale_slug: unique('unique_locale_slug').on(table.locale, table.slug),
}))

export const contentCategoryTranslations = mysqlTable('content_category_translations', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  category_id: bigint('category_id', { mode: 'number' }).notNull(),
  locale: varchar('locale', { length: 5 }).notNull().$type<Locale>(),
  slug: varchar('slug', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  idx_category_id: index('idx_category_id').on(table.category_id),
  idx_locale: index('idx_locale').on(table.locale),
  unique_locale_slug: unique('unique_locale_slug').on(table.locale, table.slug),
}))

export const pageTranslations = mysqlTable('page_translations', {
  id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
  page_id: bigint('page_id', { mode: 'number' }).notNull(),
  locale: varchar('locale', { length: 5 }).notNull().$type<Locale>(),
  slug: varchar('slug', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  meta_description: varchar('meta_description', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  idx_page_id: index('idx_page_id').on(table.page_id),
  idx_locale: index('idx_locale').on(table.locale),
  unique_locale_slug: unique('unique_locale_slug').on(table.locale, table.slug),
}))

// Define relationships
export const blogRelations = relations(blogs, ({ many }) => ({
  translations: many(blogTranslations)
}))

export const blogTranslationsRelations = relations(blogTranslations, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogTranslations.blog_id],
    references: [blogs.id]
  })
}))

export const projectRelations = relations(projects, ({ many }) => ({
  translations: many(projectTranslations)
}))

export const projectTranslationsRelations = relations(projectTranslations, ({ one }) => ({
  project: one(projects, {
    fields: [projectTranslations.project_id],
    references: [projects.id]
  })
}))

export const contentCategoryRelations = relations(contentCategories, ({ many }) => ({
  translations: many(contentCategoryTranslations)
}))

export const contentCategoryTranslationsRelations = relations(contentCategoryTranslations, ({ one }) => ({
  category: one(contentCategories, {
    fields: [contentCategoryTranslations.category_id],
    references: [contentCategories.id]
  })
}))

export const pageRelations = relations(pages, ({ many }) => ({
  translations: many(pageTranslations)
}))

export const pageTranslationsRelations = relations(pageTranslations, ({ one }) => ({
  page: one(pages, {
    fields: [pageTranslations.page_id],
    references: [pages.id]
  })
})) 