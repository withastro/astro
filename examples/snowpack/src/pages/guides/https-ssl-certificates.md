---
layout: ../../layouts/content.astro
title: SSL Certificates
description: How to use HTTPs during development and generate SSL certifcates for your Snowpack build.
---

<div class="notification">
This guide has an example repo:
<a href="https://github.com/snowpackjs/snowpack/tree/main/examples/https-ssl-certificates/">
    examples/https-ssl-certificates
</a>
</div>

```
npm run dev -- --secure
```

Snowpack provides an easy way to use a local HTTPS server during development through the use of the `--secure` flag. When enabled, Snowpack will look for a `snowpack.key` and `snowpack.crt` file in the root directory and use that to create an HTTPS server with HTTP2 support enabled.

### Generating SSL Certificates

You can automatically generate credentials for your project via either:

- [devcert (no install required, but openssl is a prerequisite)](https://github.com/davewasmer/devcert-cli): `npx devcert-cli generate localhost`
- [mkcert (install required)](https://github.com/FiloSottile/mkcert): `mkcert -install && mkcert -key-file snowpack.key -cert-file snowpack.crt localhost`

In most situations you should add personally generated certificate files (`snowpack.key` and `snowpack.crt`) to your `.gitignore` file.
