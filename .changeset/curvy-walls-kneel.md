---
'astro': patch
---

Adds support for allowing integrations to refresh the content layer

This adds a new object to the `astro:server:setup` hook that allows integrations to refresh the content layer. This can be used for example to register a webhook endpoint during dev, or to open a socket to a CMS to listen for changes.

The hook is passed a function called `refreshContent` that can be called to refresh the content layer. It can optionally be passed a `loaders` property, which is an array of loader names. If provided, only collections that use those loaders will be refreshed. If not provided, all loaders will be refreshed. A CMS integration could use this to only refresh its own collections.

It can also pass a `context` object, which will be passed to the loaders. This can be used to pass arbitrary data, such as the webhook body or an event from the websocket.

```ts
 {
    name: 'my-integration',
    hooks: {
        'astro:server:setup': async ({ server, refreshContent }) => {
            server.middlewares.use('/_refresh', async (req, res) => {
                if(req.method !== 'POST') {
                  res.statusCode = 405
                  res.end('Method Not Allowed');
                  return
                }
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', async () => {
                    try {
                        const webhookBody = JSON.parse(body);
                        await refreshContent({
                          context: { webhookBody },
                          loaders: ['my-loader']
                        });
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Content refreshed successfully' }));
                    } catch (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to refresh content: ' + error.message }));
                    }
                });
            });
        }
    }
}
```

