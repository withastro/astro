# @astrojs/react ⚛️

This **[Astro integration][astro-integration]** enables server-side rendering and client-side hydration for your [React](https://react.dev/) components.

## Documentation

Read the [`@astrojs/react` docs][docs]

## React Compiler (experimental)

Install the optional Oxc compiler:

```sh
pnpm add -D oxc-transform-react
```

Enable it in `astro.config.mjs`:

```js
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react({ compiler: true })],
});
```

The compiler automatically memoizes client components and hooks. It does not compile server rendering. The target defaults to your installed React major version. For React 17 or 18, also install `react-compiler-runtime` as a runtime dependency.

Pass an options object, such as `compiler: { compilationMode: 'annotation' }`, to configure Oxc's React Compiler. The integration's `include` and `exclude` filters apply; dependencies and Astro files are excluded. Compilation is disabled by default.

## Migrating custom Babel transforms

The integration uses `@vitejs/plugin-react` v6 and Oxc for JSX and Fast Refresh. The `babel` integration option has been removed in this major release.

If you use custom Babel transforms, install `@rolldown/plugin-babel` and `@babel/core`, keeping your existing Babel plugins and presets installed:

```sh
pnpm add -D @rolldown/plugin-babel @babel/core
```

Move your Babel plugins and presets from `react({ babel: ... })` to `babel()` in `vite.plugins`. For example, migrate a project using `babel-plugin-styled-components` from:

```js
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react({ babel: { plugins: ['babel-plugin-styled-components'] } })],
});
```

To:

```js
import react from '@astrojs/react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [
      babel({
        plugins: ['babel-plugin-styled-components'],
      }),
    ],
  },
});
```

This also works with `react({ compiler: true })`. Babel runs before Oxc transforms TypeScript and JSX. The Babel plugin automatically enables parsing for `.jsx`, `.ts`, and `.tsx` files. It does not load `babel.config.js` or `.babelrc` files; pass the options directly to `babel()`. The old `babel` callback is not supported; use the plugin's [`overrides` and preset hooks](https://github.com/rolldown/plugins/tree/main/packages/babel#options) for conditional transforms.

Do not enable `babel-plugin-react-compiler` on the same components as the Oxc compiler.

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
[docs]: https://docs.astro.build/en/guides/integrations-guide/react/
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
[astro-integration]: https://docs.astro.build/en/guides/integrations/
