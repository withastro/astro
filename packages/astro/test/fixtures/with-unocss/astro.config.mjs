// Full Astro Configuration API Documentation:
// https://docs.astro.build/reference/configuration-reference

import Unocss from 'unocss/vite';

// @ts-check
export default /** @type {import('astro').AstroUserConfig} */ ({
  vite: {
    plugins: [Unocss()],
  },
});
