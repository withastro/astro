import { defineConfig } from 'astro/config';
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: 'https://mdx-is-neat.com/',
  integrations: [mdx()]
});
