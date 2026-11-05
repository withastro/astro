# @astrojs/solid-js-renderer

The Solid renderer of Astro components. Use it with [`@astrojs/vite-plugin-astro`](https://github.com/withastro/astro/blob/main/packages/vite-plugin-astro) to server-render Solid components used in `.astro` files and hydrate them as islands.

You don't need this package when using Astro without the Vite plugin. Astro projects use [`@astrojs/solid-js`](https://github.com/withastro/astro/blob/main/packages/integrations/solid), which registers this renderer itself.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import solid from '@astrojs/solid-js-renderer';
import viteSolid from 'vite-plugin-solid';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [astro({ renderers: [solid()] }), viteSolid({ ssr: true })],
});
```

Compiling Solid components is the job of `vite-plugin-solid`, added to the Vite `plugins` next to `astro()`.

## Documentation

Read how to use [`@astrojs/solid-js-renderer` in the Astro Vite plugin docs][docs]

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
