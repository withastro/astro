import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    experimental: {
        env: {
            schema: {
                FOO: envField.string({
                    context: 'server',
                    access: 'secret',
                    default: 'this is a secret'
                }),
            },
        }
    }
});