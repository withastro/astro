import { defineConfig } from "astro/config";

export default defineConfig({
  redirects: {
    "/temp-redirect": {
      status: 307,
      destination: "/destination",
    },
  },
});

