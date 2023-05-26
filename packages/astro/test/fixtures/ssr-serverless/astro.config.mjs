import { defineConfig } from 'astro/config';
export default defineConfig({
    build: {
        mode: "serverless"
    },
    output: "server"
})