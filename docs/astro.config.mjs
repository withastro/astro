/** @type {import('astro').AstroConfig} */
export default {
  buildOptions: {
    site: 'https://docs.astro.build/',
  },
  renderers: [
    // Our main renderer for frontend components
    '@astrojs/renderer-preact',
    // Needed for Algolia search component
    '@astrojs/renderer-react',
  ],
  /** @type {import('astro').AstroMarkdownOptions} */
  markdownOptions: {
    remarkPlugins: [
      'remark-footnotes',
      '@silvenon/remark-smartypants',
      'remark-gfm',
      'remark-sectionize',
    ],
    rehypePlugins: ['rehype-autolink-headings'],
  },
};
