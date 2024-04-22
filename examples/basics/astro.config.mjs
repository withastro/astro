import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    experimental: {
        env: {
            schema: {
                PUBLIC_TEST: envField.string({ context: "client", access: "public", optional: true, default: "TEST" })
            }
        }
    }
});
