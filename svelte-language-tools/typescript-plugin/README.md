# A TypeScript plugin for Svelte intellisense

This plugin provides intellisense for interacting with Svelte files. It is in a very early stage, so expect bugs. So far the plugin supports

-   Rename
-   Find Usages
-   Go To Definition
-   Diagnostics

Note that these features are only available within TS/JS files. Intellisense within Svelte files is provided by the [svelte-language-server](https://www.npmjs.com/package/svelte-language-server).

## Usage

The plugin comes packaged with the [Svelte for VS Code extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using that one, you don't need to add it manually.

Adding it manually:

`npm install --save-dev typescript-svelte-plugin`

Then add it to your `tsconfig.json` or `jsconfig.json`:

```
{
    "compilerOptions": {
        ...
        "plugins": [{
            "name": "typescript-svelte-plugin"
        }]
    }
}
```

## Limitations

Changes to Svelte files are only recognized after they are saved to disk.

## Credits

-   [pushkine](https://github.com/pushkine) for his initial POC and the inspiration/discussion that stemmed from it
