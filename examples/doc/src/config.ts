export const sidebar = [
  {
    text: 'Introduction',
    children: [
      { text: 'What is Astro?', link: '/' },
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Configuration', link: '/guide/configuration' },
      { text: 'Asset Handling', link: '/guide/assets' },
      { text: 'Markdown Extensions', link: '/guide/markdown' },
      { text: 'Using Vue in Markdown', link: '/guide/using-vue' },
      { text: 'Deploying', link: '/guide/deploy' }
    ]
  },
  {
    text: 'Advanced',
    children: [
      { text: 'Frontmatter', link: '/guide/frontmatter' },
      { text: 'Global Computed', link: '/guide/global-computed' },
      { text: 'Global Component', link: '/guide/global-component' },
      { text: 'Customization', link: '/guide/customization' },
      {
        text: 'Differences from Vuepress',
        link: '/guide/differences-from-vuepress'
      }
    ]
  }
]
