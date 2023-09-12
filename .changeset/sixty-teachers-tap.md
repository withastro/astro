---
'@astrojs/vercel': minor
---

Enable Vercel Speed Insights and Vercel Web Analytics individually.
Deprecates the `analytics` property in `astro.config.mjs` in favor of `speedInsights` and `webAnalytics`.

If you're using the `analytics` property, you'll need to update your config to use the new properties:

```diff
// astro.config.mjs
export default defineConfig({
	adapter: vercel({
-		analytics: true,
+		webAnalytics: {
+			enabled: true
+		},
+		speedInsights: {
+			enabled: true
+		}
	})
});
```

Allow configuration of Web Analytics with all available configuration options.
Bumps @vercel/analytics package to the latest version.
