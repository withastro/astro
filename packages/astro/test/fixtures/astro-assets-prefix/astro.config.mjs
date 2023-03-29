import { defineConfig } from 'astro/config';
import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
    // test custom base to mess things up
    base: '/custom-base',
    integrations: [react()],
    build: {
        assetsPrefix: 'http://localhost:4321'
    },
    experimental: {
        assets: true
    }
});
