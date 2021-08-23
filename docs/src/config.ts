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
    { text: 'Component Syntax', link: 'core-concepts/astro-components' },
    { text: 'Pages', link: 'core-concepts/astro-pages' },
    { text: 'Layouts', link: 'core-concepts/layouts' },
    { text: 'Routing', link: 'core-concepts/routing' },
    { text: 'Partial Hydration', link: 'core-concepts/component-hydration' },

    { text: 'Guides', header: true },
    { text: 'Styling & CSS', link: 'guides/styling' },
    { text: 'Markdown', link: 'guides/markdown-content' },
    { text: 'Debugging', link: 'guides/debugging' },
    { text: 'Data Fetching', link: 'guides/data-fetching' },
    { text: 'Pagination', link: 'guides/pagination' },
    { text: 'RSS', link: 'guides/rss' },
    { text: 'Supported Imports', link: 'guides/imports' },
    { text: 'Aliases', link: 'guides/aliases' },
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
  de: [
    { text: 'Willkommen', header: true },
    { text: 'Einführung', link: 'de/getting-started' },
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
  es: [
    { text: 'Configuración', header: true },
    { text: 'Empezando', link: 'es/getting-started' },
  ],
  'zh-CN': [
    { text: '起步', header: true },
    { text: '入门指南', link: 'zh-CN/getting-started' },
    { text: '快速入门', link: 'zh-CN/quick-start' },
    { text: '安装指南', link: 'zh-CN/installation' },
    { text: '模板样例', link: 'zh-CN/examples' },
  ],
  'zh-TW': [
    { text: '設定', header: true },
    { text: '新手上路', link: 'zh-TW/getting-started' },
    { text: '快速開始', link: 'zh-TW/quick-start' },
    { text: '安裝', link: 'zh-TW/installation' },
    { text: '範例', link: 'zh-TW/examples' },
  ],
  bg: [
    { text: 'Главни', header: true },
    { text: 'Започваме!', link: 'bg/getting-started' },
  ],
  fr: [
    { text: 'Bienvenue', header: true },
    { text: 'Bien démarrer', link: 'fr/getting-started' },
    { text: 'Démarrage rapide', link: 'fr/quick-start' },
    { text: 'Installation', link: 'fr/installation' },
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
