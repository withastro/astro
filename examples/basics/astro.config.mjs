// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    experimental: {
        fonts: {
            families: [
                {
                    name: "Roboto",
                    provider: "local",
                    src: [
                        {
                            paths: ["./src/test.woff"]
                        }
                    ]
                }
            ]
        }
    }
});
