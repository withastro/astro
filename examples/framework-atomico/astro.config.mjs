import { defineConfig } from "astro/config";
import Atomico from "@atomico/astro";

// https://astro.build/config
export default defineConfig({
  vite: {
    ssr: {
      noExternal: true,
    },
  },
  integrations: [Atomico({ cssLiterals: { minify: true, postcss: true } })],
});
