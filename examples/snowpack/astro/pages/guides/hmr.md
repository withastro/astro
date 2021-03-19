---
layout: layouts/content.hmx
title: Hot Module Replacement (HMR)
description: Enable Snowpack's Hot Module Replacement (HMR) on your development server.
published: false
---

<div class="stub">
This article is a stub, you can help fix it by removing duplicate content from /concepts/hot-module-replacement and writing it in a <a href="https://documentation.divio.com/how-to-guides/">guide format</a>
</div>

Hot Module Replacement (HMR) is the ability for Snowpack to push file changes to the browser without triggering a full page refresh. This article is about enabling HMR and connecting to the HMR dev server.

For instructions on using HMR, refer to the `import.meta.hot` API documentation.

### Is HMR Connected?

You can tell if HMR is connected by checking your browser dev console. If you see the following message, that means that HMR is enabled and connected.

```
[ESM-HMR] listening for file changes..
```

### Enable HMR: Snowpack Dev Server

HMR is enabled by default when you run `snowpack dev`. The Snowpack dev server will add the necessary scripts for your browser, and no configuration is required for most users. You can toggle this support off during development via the [`devOptions.hmr` configuration option](/reference/configuration).

### Enable HMR: Custom Server

_Note: Full HMR is not yet supported. Only full page reloads are currently working. Follow updates here: [https://github.com/snowpackjs/snowpack/issues/1935](https://github.com/snowpackjs/snowpack/issues/1935)_

If you use your own server (ex: Rails) to serve your application during development, there are a couple of small steps to enable HMR.

HMR is not enabled by default if you are using `snowpack build --watch` for local development (instead of `snowpack dev`). Set `devOptions.hmr: true` in your Snowpack configuration (or, use `--hmr`) to enable HMR support in your application.

We also recommend that you manually add the Snowpack HMR client to your HTML (development only, not needed in production):

```html
<!-- Load the script to enable HMR. -->
<script type="module" src="/_snowpack/hmr-client.js"></script>
```

### Configuring HMR

HMR is powered by a WebSocket connection between the client and Snowpack. If you are having trouble connecting to the client, you may need need to tell it where Snowpack's HMR Websocket server is running.

First, make sure that `devOptions.hmr` is set to true. This guarantees that the HMR Websocket is running and ready to accept connections in both `dev` and `build`.

By default, the client will try to connect to the HMR server at the current host (ex: `localhost`) using one of two ports:

- `snowpack dev`: The same port as the dev server
- `snowpack build`: port `12321`

You can control this by setting `devOptions.hmrPort` manually via configuration or setting the following global script variable somewhere on the page **before** the `hmr-client.js` script runs:

```html
<!-- Optional: Set the HMR websocket URL, overrides default -->
<script>
  window.HMR_WEBSOCKET_URL = 'ws://localhost:4444';
</script>
<script type="module" src="/_snowpack/hmr-client.js"></script>
```

### Disable HMR

Set `devOptions.hmr` to false to disable HMR in all cases.
