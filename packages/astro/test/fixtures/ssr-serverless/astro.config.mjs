import { defineConfig } from 'astro/config';
export default defineConfig({
    build: {
        split: "serverless"
    },
    output: "server"
})