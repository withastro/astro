import { defineConfig } from "astro/config" 
import vue from "@astrojs/vue"
import image from "@astrojs/image"

export default defineConfig({
    integrations: [
        vue(),
        image({
            serviceEndpoint: '@astrojs/image/sharp',
        }),
    ],
})