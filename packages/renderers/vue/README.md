# @astrojs/vue-renderer

The Vue renderer of Astro components: it server-renders Vue components used in `.astro` files and hydrates them as islands. It is plain data for `astro()` from [`@astrojs/vite-plugin-astro`](../../vite-plugin-astro/), in a Vite project without the `astro` CLI. Astro projects use [`@astrojs/vue`](../../integrations/vue/), which registers this renderer.

```js
// vite.config.js
import astro from '@astrojs/vite-plugin-astro';
import vue from '@astrojs/vue-renderer';
import viteVue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [astro({ renderers: [vue()] }), viteVue()],
});
```

Compiling Vue components is the job of `@vitejs/plugin-vue`, added to the Vite `plugins` next to `astro()`.

## Documentation

Read how to use [`@astrojs/vue-renderer` in the Astro Vite plugin docs][docs]

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
