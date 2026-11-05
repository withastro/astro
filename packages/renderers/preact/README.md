# @astrojs/preact-renderer

The Preact renderer of Astro components. Use it with [`@astrojs/vite-plugin-astro`](https://github.com/withastro/astro/blob/main/packages/vite-plugin-astro) to server-render Preact components used in `.astro` files and hydrate them as islands.

You don't need this package when using Astro without the Vite plugin. Astro projects use [`@astrojs/preact`](https://github.com/withastro/astro/blob/main/packages/integrations/preact), which registers this renderer itself.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import preact from '@astrojs/preact-renderer';
import { preact as vitePreact } from '@preact/preset-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [astro({ renderers: [preact()] }), vitePreact()],
});
```

Compiling Preact components is the job of `@preact/preset-vite`, added to the Vite `plugins` next to `astro()`.

## Documentation

Read how to use [`@astrojs/preact-renderer` in the Astro Vite plugin docs][docs]

## Support

- Get help in the [Astro Discord][discord]. Post questions in our `#support` forum, or visit our dedicated `#dev` channel to discuss current development and more!
- Check our [Astro Integration Documentation][astro-integration] for more on integrations.
- Submit bug reports and feature requests as [GitHub issues][issues].

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR! These links will help you get started:

- [Contributor Manual][contributing]
- [Code of Conduct][coc]
- [Community Guide][community]

## License

MIT

Copyright (c) 2023–present [Astro][astro]

[astro]: https://astro.build/
[docs]: https://docs.astro.build/en/reference/vite-plugin-astro/
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
