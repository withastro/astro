import { defineConfig} from "astro/config";

import node from "@astrojs/node"

export default defineConfig({
  base: "/",
  output: "static",
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    fallback: {
      es: "en",
    },
    routing: {
      fallbackType: "rewrite",
      prefixDefaultLocale: false,
    },
  },
  adapter: node({mode: 'standalone'})
});
