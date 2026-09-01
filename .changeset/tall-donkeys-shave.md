---
'@astrojs/node': minor
---

Adds a `keepAliveTimeout` option to configure how long the standalone server keeps an idle connection open

Node.js closes idle keep-alive connections after 5 seconds by default, which is shorter than the idle timeout of most reverse proxies and load balancers (AWS Application Load Balancer, for instance, defaults to 60 seconds). When the proxy outlives the server on a pooled connection, it can send a request onto a socket the server has already closed and answer the client with a `502`. The failure only shows up on low-traffic servers, where connections stay idle long enough to reach the timeout.

The adapter now accepts a `keepAliveTimeout` in milliseconds, applied to the server before it starts listening:

```js
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
    keepAliveTimeout: 65_000,
  }),
});
```

Leaving the option unset keeps the current behavior.
