# @astrojs/image-napi

This package provides an Astro image service powered by [`@napi-rs/image`](https://image.napi.rs).

## Usage

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { napiImageService } from '@astrojs/image-napi';

export default defineConfig({
	image: { service: napiImageService() },
});
```

## Support

- Get help in the [Astro Discord][discord]. Post questions in our `#support` forum, or visit our dedicated `#dev` channel to discuss current development and more!

- Check our [Astro Image Documentation][astro-images] for more on image services.

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
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
[astro-images]: https://docs.astro.build/en/guides/images/
