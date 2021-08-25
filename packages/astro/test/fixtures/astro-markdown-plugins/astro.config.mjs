export default {
  renderers: [
    '@astrojs/renderer-preact'
  ],
  markdownOptions: {
    remarkPlugins: [
      'remark-code-titles',
      'remark-slug',
      ['rehype-autolink-headings', { behavior: 'prepend' }],
    ],
    rehypePlugins: [
      ['rehype-toc', { headings: ["h2", "h3"] }],
      ['rehype-add-classes', { 'h1,h2,h3': 'title', }],
    ]
  },
  buildOptions: {
    sitemap: false,
  },
};
