import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import { fileURLToPath } from 'node:url';

export default defineConfig({
  integrations: [astroClientClickDirective(), astroClientPasswordDirective(), react()],
});

function astroClientClickDirective() {
  return {
    name: 'astro-client-click',
    hooks: {
      'astro:config:setup': (opts) => {
        opts.addClientDirective({
          name: 'click',
          entrypoint: fileURLToPath(new URL('./client-click.js', import.meta.url))
        });
      }
    }
  };
}

function astroClientPasswordDirective() {
  return {
    name: 'astro-client-click',
    hooks: {
      'astro:config:setup': (opts) => {
        opts.addClientDirective({
          name: 'password',
          entrypoint: fileURLToPath(new URL('./client-password.js', import.meta.url))
        });
      }
    }
  };
}
