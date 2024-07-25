// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
    output: "server",
    integrations: [
        node({
            mode: "standalone"
        }),
        {
            name: "test",
            hooks: {
                "astro:config:done": ({ injectTypes }) => {
                    injectTypes({
                        filename: "types.d.ts",
                        content: "declare const FOO: string;"
                    })
                }
            }
        }
    ],
    experimental: {
        env: {
            schema: {}
        },
        actions: true
    }
});
