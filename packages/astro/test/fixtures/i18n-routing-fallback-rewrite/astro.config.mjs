import { defineConfig} from "astro/config";

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
});
