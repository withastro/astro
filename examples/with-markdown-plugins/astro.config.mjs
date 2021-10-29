// Full Astro Configuration API Documentation:
// https://docs.astro.build/reference/configuration-reference

// @type-check enabled!
// VSCode and other TypeScript-enabled text editors will provide auto-completion,
// helpful tooltips, and warnings if your exported object is invalid.
// You can disable this by removing "@ts-check" and `@type` comments below.
import astroRemark from '@astrojs/markdown-remark';

// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
  // Enable Custom Markdown options, plugins, etc.
  markdownOptions: {
    render: [
      astroRemark,
      {
        remarkPlugins: ['remark-code-titles', 'remark-slug'],
        rehypePlugins: [
          ['rehype-autolink-headings', { behavior: 'prepend' }],
          ['rehype-toc', { headings: ['h2', 'h3'] }],
          ['rehype-add-classes', { 'h1,h2,h3': 'title' }],
        ],
      },
    ],
  },
});
