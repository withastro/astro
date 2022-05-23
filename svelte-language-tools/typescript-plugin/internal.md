# Notes on how this works internally

To get a general understanding on how to write a TypeScript plugin, read [this how-to](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin).

However, for getting Svelte support inside TS/JS files, we need to do more than what's shown in the how-to. We need to

-   make TypeScript aware that Svelte files exist and can be loaded
-   present Svelte files to TypeScript in a way TypeScript understands
-   enhance the language service (the part that's shown in the how-to)

To make TypeScript aware of Svelte files, we need to patch its module resolution algorithm. `.svelte` is not a valid file ending for TypeScript, so it searches for files like `.svelte.ts`. This logic is decorated in `src/module-loader` to also resolve Svelte files. They are resolved to file-type TS/JS, which leads us to the next obstacle: to present Svelte files to TypeScript in a way it understands.

We achieve that by utilizing `svelte2tsx`, which transforms Svelte code into TS/JS code. We do that transformation by patching `readFile` of TypeScript's project service in `src/svelte-snapshots`: If a Svelte file is read, transform the code before returning it. During that we also patch the ScriptInfo that TypeScript uses to interact with files. We patch the methods that transform positions to offsets and vice versa and either do transforms on the generated or original code, depending on the situation.

The last step is to enhance the language service. For that, we patch the desired methods and apply custom logic. Most of that is transforming the generated code positions to the original code positions.

Along the way, we need to patch some internal methods, which is brittly and hacky, but to our knowledge there currently is no other way.

To make it work with the VS Code extension we need to provide the plugin within `contributes.typescriptServerPlugins`. That way the plugin is always loaded. To enable/disable it, we use a semi-public command that tells TypeScript to configure the plugin. That configuration then tells this plugin whether or not it is enabled.

## Limitations

Currently, changes to Svelte files are only recognized after they are saved to disk. That could be changed by adding `"languages": ["svelte"]` to the plugin provide options. The huge disadvantage is that diagnostics, rename etc within Svelte files no longer stay in the control of the language-server, instead TS/JS starts interacting with Svelte files on a much deeper level, which would mean patching many more undocumented/private methods, and having less control of the situation overall.
