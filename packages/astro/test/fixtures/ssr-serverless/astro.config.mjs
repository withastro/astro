import { defineConfig } from 'astro/config';
export default defineConfig({
    build: {
        split: true
    },
    output: "server"
})