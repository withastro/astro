# Language Server configuration

Between the Language Server config (that you can configure [through VS Code](https://code.visualstudio.com/docs/getstarted/settings) and other editors), the Astro project config and the TypeScript config, it can be really hard to understand what is meant in the source code by the word `config`

In most cases, `config` will usually represent the Language Server config. Notably, you might see the word config being thrown a lot in [the different plugins](./plugins/intro.md) to check if certain features are enabled. For other configs such as the `js/tsconfig.json` or the `astro.config.js`, we'll instead usually use different identifiers such as `tsConfig` or `astroConfig`, in order to avoid confusion.

To facilitate accessing and updating the language server config, we use a class creatively named [ConfigManager](/packages/language-server/src/core/config/ConfigManager.ts). References to an unique instance of it is injected in every plugin.
