import type { AstroUserConfig } from "astro";

const config: AstroUserConfig = {
  buildOptions: {
    site: "https://astro.build",
    sitemap: true,
  },
  renderers: [],
  markdownOptions: {
    render: [
      "@astrojs/markdown-remark",
      {
        remarkPlugins: [
          "remark-smartypants",
          ["remark-autolink-headings", { behavior: "wrap" }],
        ],
        rehypePlugins: [
          "rehype-slug",
          ["rehype-autolink-headings", { behavior: "wrap" }],
        ],
        syntaxHighlight: 'shiki',
      },
    ],
  },
  vite: {
    ssr: {
      noExternal: ['smartypants'],
      external: ["svgo"],
    },
  },
};

export default config;
