---
'astro': patch
---

Adds `security.allowedDomains` configuration to validate `X-Forwarded-Host` headers in SSR

The `X-Forwarded-Host` header will now only be trusted if it matches one of the configured allowed host patterns. This prevents [host header injection attacks](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection) that can lead to cache poisoning and other security vulnerabilities.

Configure allowed host patterns to enable `X-Forwarded-Host` support:

```js
// astro.config.mjs
export default defineConfig({
  output: 'server',
  adapter: node(),
  security: {
    allowedDomains: [
      { hostname: 'example.com' },
      { hostname: '*.example.com' },
      { hostname: 'cdn.example.com', port: '443' }
    ]
  }
})
```

The patterns support wildcards (`*` and `**`) for flexible hostname matching and can optionally specify protocol and port.

Additionally, this fixes a bug where protocol validation was incorrectly formatted, causing valid `X-Forwarded-Host` headers to be rejected when `allowedDomains` was configured.

#### Breaking change

Previously, `Astro.url` would reflect the value of the `X-Forwarded-Host` header. While this header is commonly used by reverse proxies like Nginx to communicate the original host, it can be sent by any client, potentially allowing malicious actors to poison caches with incorrect URLs.

If you were relying on `X-Forwarded-Host` support, add `security.allowedDomains` to your configuration to restore this functionality securely. When `allowedDomains` is not configured, `X-Forwarded-Host` headers are now ignored by default.
