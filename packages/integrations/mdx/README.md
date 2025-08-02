# @astrojs/mdx 📝

This **[Astro integration][astro-integration]** enables the usage of [MDX](https://mdxjs.com/) components and allows you to create pages as `.mdx` files.

## Documentation

Read the [`@astrojs/mdx` docs][docs]

## Experimental Features

### Alternative MDX Compilers

**⚠️ Experimental:** This feature is experimental and may change in future versions.

The MDX integration now supports using alternative MDX compilers. You can choose between the default MDX compiler or the experimental mdx-hybrid compiler.

To use the mdx-hybrid compiler, first install it:

```bash
npm install @mdx-hybrid/core
```

Then configure your `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    mdx({
      compiler: 'mdx-hybrid', // 'mdx' (default) | 'mdx-hybrid'
    }),
  ],
});
```

The mdx-hybrid compiler offers automatic engine selection between Rust and JavaScript for optimal performance. Note that plugin compatibility may vary between compilers.

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
[docs]: https://docs.astro.build/en/guides/integrations-guide/mdx/
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
