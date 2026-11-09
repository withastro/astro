# @astrojs/vite-plugin-astro

A Vite plugin for the Astro component language. It compiles `.astro` files in any Vite project, and your server code renders them with `renderToString()` or `renderToResponse()` from [`@astrojs/runtime`](../runtime/), including their scoped styles, scripts, and framework islands. It also exposes its configuration (`root`, `publicDir`, `site`, `compressHTML`, `trailingSlash`, renderers, and client directives) to other plugins through `api.astro`. See [API.md](./API.md) for the plugin API.

## Documentation

Read the [`@astrojs/vite-plugin-astro` docs][docs]

## Support

- Get help in the [Astro Discord][discord]. Post questions in our `#support` forum, or visit our dedicated `#dev` channel to discuss current development and more!
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
