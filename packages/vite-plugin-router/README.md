# @astrojs/vite-plugin-router

A Vite plugin for Astro's file-based routing. With `astro()` from [`@astrojs/vite-plugin-astro`](../vite-plugin-astro/), it serves the pages and endpoints in `src/pages/` from `vite dev` and builds them with `vite build`: prerendered pages and, when a route renders on demand, a server entry that default-exports a Web `fetch` handler. It also runs the request pipeline (middleware, redirects, rewrites, error pages, server islands, `<ClientRouter />`) and exposes the API that feature plugins build on, `api.astroRouter`. See [API.md](./API.md) for the plugin API.

## Documentation

Read the [`@astrojs/vite-plugin-router` docs][docs]

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
[docs]: https://docs.astro.build/en/reference/vite-plugin-router/
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
