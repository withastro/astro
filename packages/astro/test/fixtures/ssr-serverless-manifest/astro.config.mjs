import { defineConfig } from 'astro/config';
export default defineConfig({
    build: {
        ssrMode: "serverless"
    },
    output: "server"
})