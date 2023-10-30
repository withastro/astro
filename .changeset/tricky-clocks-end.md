---
'@astrojs/vercel': minor
---

The Vercel adapter now allows you to enable streaming!

Bring better performance to your visitors by showing them content as it is rendered. The browser can also start loading the required stylesheets and scripts much sooner, which ultimately results in faster full page loads.


```diff
export default defineConfig({
    output: "server",
    adapter: vercel({
+       streaming: true
    }),
});
