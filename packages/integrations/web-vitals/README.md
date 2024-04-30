# @astrojs/web-vitals (experimental) ⏱️

This **[Astro integration][astro-integration]** enables tracking real-world website performance and storing the data in [Astro DB][db].

## Pre-requisites

- [Astro DB](https://astro.build/db) — `@astrojs/web-vitals` will store performance data in Astro DB in production
- [An SSR adapter](https://docs.astro.build/en/guides/server-side-rendering/) — `@astrojs/web-vitals` injects a server endpoint to manage saving data to Astro DB

## Installation

1. Install and configure the Web Vitals integration using `astro add`:

   ```sh
   npx astro add web-vitals
   ```

2. Push the tables added by the Web Vitals integration to Astro Studio:

   ```sh
   npx astro db push
   ```

3. Redeploy your site.

4. Visit your project dashboard at https://studio.astro.build to see the data collected.

Learn more about [Astro DB](https://docs.astro.build/en/guides/astro-db/) and [deploying with Astro Studio](https://docs.astro.build/en/guides/astro-db/#astro-studio) in the Astro docs.

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
[db]: https://astro.build/db/
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
