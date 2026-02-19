import { defineConfig } from 'astro/config';

import virtual from "./src/plugins/virtual";

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [virtual],
    },
});
