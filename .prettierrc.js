// Heads up: This file should be renamed to `.cjs`, however if we did that, changesets wouldn't be able to load it
module.exports = {
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: true,
  plugins: ['./node_modules/prettier-plugin-astro'],
  overrides: [
    {
      // Changesets run Prettier using our configuration, however it uses a very old version of Prettier that does
      // not support our plugin and it ends up doing more harm than good. As such, we'll disable our plugin for changelogs
      files: ['CHANGELOG.md'],
      options: {
        plugins: [],
      },
    },
    {
      files: ['.*', '*.json', '*.md', '*.toml', '*.yml'],
      options: {
        useTabs: false,
      },
    },
    {
      files: ['**/*.astro'],
      options: {
        parser: 'astro',
      },
    },
  ],
};
