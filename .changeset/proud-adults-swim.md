---
'astro': major
---

Fixes a case where environment variables would not be refreshed.

This fix introduces some changes that are breaking for adapters adding environment variables to `process.env` in order to reach `astro:env`:

```diff
+ import { ENV_SYMBOL } from "astro/env/setup"

function setProcessEnv(config: AstroConfig, env: Record<string, unknown>) {
	const getEnv = createGetEnv(env);

+    (globalThis as any)[ENV_SYMBOL] ??= {};
	if (config.env.schema) {
		for (const key of Object.keys(config.env.schema)) {
			const value = getEnv(key);
-			if (value !== undefined) {
-				process.env[key] = value;
			}
+            (globalThis as any)[ENV_SYMBOL] = value;
		}
	}
}
```