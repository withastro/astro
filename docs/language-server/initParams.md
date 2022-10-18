# Init parameters for the server

The language server takes the following initialization parameters, if you're planning on using the language server in your own editor, make sure you pass them!

| Name                              | Type                                           | Description                                                                                                                                                                                                                                      |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `typescript`                      | `{serverPath: string, localizedPath?: string}` | Path to TypeScript's `tsserverlibrary.js`, required for TypeScript features to works. Unless your editor bundle a version of TypeScript, you probably want `node_modules/typescript/lib/tsserverlibrary.js`                                      |
| `environment`                     | `'node' \| 'browser'`                          | Determine if the language server is running in Node or in the Browser. Certain features might be disabled or behave differently depending on this                                                                                                |
| `dontFilterIncompleteCompletions` | `boolean`                                      | By default, the language server will attempt to filter incomplete completions lists based on certain heuristics. If your editor includes client-side filtering, you probably want to enable this setting                                         |
| `isTrusted`                       | `boolean`                                      | If your editor has a workspace trust feature (such as [VS Code's Workspace Trust](https://code.visualstudio.com/docs/editor/workspace-trust)), set this accordingly to the current status and the language server will disable affected features |

All settings are technically optional, however certain features might be disabled if you don't provide them. The language server will warn appropriately in its log or through a notification if you're missing some settings.
