import {defineConfig} from "astro/config";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
    adapter: vercel({
        createLocals: ({request}) => {
            console.log(request);
            return {
                "foo": "bar"
            }
        }}),
    output: 'server'
});