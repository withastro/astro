---
'@astrojs/cloudflare': minor
---

Fix the static asset fallback handling to rewrite the headers. This shouldn't affect Cloudflare pages deployments as static file handling shouldn't hit fallback, but this does add compatibility with Cloudflare's workerd, the open source worker runtime, as by default files are sent as `application/octet-stream` https://github.com/cloudflare/workerd/blob/main/src/workerd/server/workerd.capnp#LL665C29-L665C53
