# How is the language-server started by VS Code (and other editors)

Looking through the [language-server](/packages/language-server/) package you might notice that there's no simple `index.ts` or `main.ts` entrypoint. The entrypoints are actually in the [bin folder](/packages/language-server/bin), when instantating an instance of the language-server, depending on the execution context the proper entrypoint file get executed ([browserServer.js](/packages/language-server/bin/browserServer.js) when in a web environnement and [nodeServer.js](/packages/language-server/bin/nodeServer.js) otherwise)

This then calls the corresponding code located in either [browser.ts](/packages/language-server/src/browser.ts) or [node.ts](/packages/language-server/src/node.ts). The only difference between the two is how the connection to the language-server is created, so they eventually both calls the `startLanguageServer` method from [server.ts](/packages/language-server/src/server.ts) using the connection they created as a parameter

On the client side, here's how the language-server client get initialized in VS Code when running in a node environnement:

```typescript
const serverModule = require.resolve('@astrojs/language-server/bin/nodeServer.js');
const serverOptions: ServerOptions = {
  run: { module: serverModule, transport: TransportKind.ipc },
};

// clientOptions omitted here for brevity
let client = createLanguageServer(serverOptions, clientOptions);
```

For the full client-side code, see the [index.ts](/packages/vscode/src/index.ts) of the VS Code extension
