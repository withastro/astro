---
'@astrojs/node': minor
---

Adds a `keepAliveTimeout` option to configure how long the standalone server keeps an idle connection open

Node.js closes an idle keep-alive connection after 5 seconds by default, which is shorter than the idle timeout of most reverse proxies and load balancers (an AWS Application Load Balancer, for instance, defaults to 60 seconds). When the proxy's idle timeout is longer than the server's, the proxy can send a request onto a socket the server has already closed. An Application Load Balancer answers the client with a `502` when that happens. It is most visible on low-traffic servers, where connections routinely stay idle long enough to reach the timeout.

The adapter now accepts a `keepAliveTimeout` in milliseconds:

```js
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: node({
    mode: 'standalone',
    keepAliveTimeout: 65000,
  }),
});
```

Leaving the option unset keeps the current behavior.
