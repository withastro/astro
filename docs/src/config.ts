export const SIDEBAR = {
  en: [
    { text: 'Setup', header: true },
    { text: 'Getting Started', link: 'getting-started' },
    { text: 'Quickstart', link: 'quick-start' },
    { text: 'Installation', link: 'installation' },
    { text: 'Examples', link: 'examples' },
    { text: 'Astro vs. X', link: 'comparing-astro-vs-other-tools' },

    { text: 'Basics', header: true },
    { text: 'Project Structure', link: 'core-concepts/project-structure' },
    { text: 'Components', link: 'core-concepts/astro-components' },
    { text: 'Pages', link: 'core-concepts/astro-pages' },
    { text: 'Layouts', link: 'core-concepts/layouts' },
    { text: 'Collections', link: 'core-concepts/collections' },
    { text: 'Partial Hydration', link: 'core-concepts/component-hydration' },

    { text: 'Guides', header: true },
    { text: 'Styling & CSS', link: 'guides/styling' },
    { text: 'Data Fetching', link: 'guides/data-fetching' },
    { text: 'Markdown', link: 'guides/markdown-content' },
    { text: 'Supported Imports', link: 'guides/imports' },
    { text: 'Deploy a Website', link: 'guides/deploy' },
    { text: 'Publish a Component', link: 'guides/publish-to-npm' },

    { text: 'Reference', header: true },
    { text: 'Built-In Components', link: 'reference/builtin-components' },
    { text: 'API Reference', link: 'reference/api-reference' },
    { text: 'CLI Reference', link: 'reference/cli-reference' },
    {
      text: 'Configuration Reference',
      link: 'reference/configuration-reference',
    },
    { text: 'Renderer Reference', link: 'reference/renderer-reference' },
  ],
  nl: [
    { text: 'Welkom', header: true },
    { text: 'Beginnen', link: 'nl/getting-started' },
  ],
  fi: [
    { text: 'Tervetuloa', header: true },
    { text: 'Aloittaminen', link: 'fi/getting-started' },
    { text: 'Pika-aloitus', link: 'fi/quick-start' },
    { text: 'Asennus', link: 'fi/installation' },
  ],
  'zh-CN': [
    { text: '起步', header: true },
    { text: '入门指南', link: 'zh-CN/getting-started' },
    { text: '快速入门', link: 'zh-CN/quick-start' },
    { text: '安装指南', link: 'zh-CN/installation' },
    { text: '模板样例', link: 'zh-CN/examples' },
  ],
  'zh-TW': [
    { text: '起步', header: true },
    { text: '入門指南', link: 'zh-TW/getting-started' },
  ],
};

export const SITE = {
  title: 'Astro Documentation',
  description: 'Build faster websites with less client-side Javascript.',
};

export const OPEN_GRAPH = {
  locale: 'en_US',
  image: {
    src: '/default-og-image.png?v=1',
    alt:
      'astro logo on a starry expanse of space,' +
      ' with a purple saturn-like planet floating in the right foreground',
  },
  twitter: 'astrodotbuild',
};
