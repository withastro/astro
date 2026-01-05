---
'@astrojs/cloudflare': major
---

Updates `wrangler` dependency to be a `peerDependency` over a `dependency`

If you haven't done so previously, you will need to install the library`wrangler` manually when deploying to Cloudflare:

```diff
// package.json
{
	"dependencies" {
+		"wrangler": "^4.53.0"
	}
}
```
