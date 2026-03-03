import { defineConfig} from "astro/config";

export default defineConfig({
    security: {
        checkOrigin: false,
        allowedDomains: [
            {
                hostname: 'localhost',
                port: '4321'
            }
        ]
    }
})