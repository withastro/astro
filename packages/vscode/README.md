# Astro support for Visual Studio Code

> 🧑‍🚀 Not sure what Astro is? See our website at [astro.build](https://astro.build)!

Provides language support for `.astro` files. This extension is powered by the [Astro language server](https://github.com/withastro/language-tools/tree/main/packages/language-server).

## Features

- Syntax & [semantic](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide) highlighting
- [Diagnostic messages](https://code.visualstudio.com/docs/editor/editingevolved#_errors-warnings)
- [IntelliSense](https://code.visualstudio.com/docs/editor/intellisense) completions ([w/ auto-imports](https://code.visualstudio.com/Docs/languages/typescript#_auto-imports))
- [Emmet completions](https://code.visualstudio.com/docs/editor/emmet) in HTML & CSS
- Props completions for JSX/TSX, Vue (Composition API only) and Svelte components
- [Code actions](https://code.visualstudio.com/docs/editor/editingevolved#_code-action) (quick fixes, sort imports etc)
- [Formatting](https://code.visualstudio.com/docs/editor/codebasics#_formatting) (powered by [Prettier](https://prettier.io/) and [prettier-plugin-astro](https://github.com/withastro/prettier-plugin-astro))
- [Symbols](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol) ([outline view](https://code.visualstudio.com/docs/getstarted/userinterface#_outline-view), [breadcrumb navigation](https://code.visualstudio.com/docs/editor/editingevolved#_breadcrumbs) etc)
- [Hover information](https://code.visualstudio.com/Docs/languages/typescript#_hover-information)
- [Go to Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition)
- [Inlay hints](https://code.visualstudio.com/docs/editor/editingevolved#_inlay-hints)
- [Code folding](https://code.visualstudio.com/docs/editor/codebasics#_folding)

A TypeScript plugin adding support for importing Astro components inside JavaScript and TypeScript files is also included.

## Configuration

You can disable most features in the extension by going to your workspace settings page. Under **Extension** find Astro configuration and uncheck the feature(s) you do not want. For example to disable error messages unselect **TypeScript > Diagnostics: Enable** (or in JSON, set `astro.typescript.diagnostics.enabled` to `false`).

Formatting can be configured through [Prettier's different configuration methods](https://prettier.io/docs/en/configuration.html). TypeScript settings can be configured using VS Code's TypeScript settings (`typescript.xxx`).

## Troubleshooting

### Unable to update to latest version

Starting from 0.19.0, the minimum VS Code version supported by this extension is 1.67.0 (April 2022). If using an older version of VS Code, 0.18.1 will be installed instead.

Before submitting an issue, please make sure you're using the latest version of both VS Code and the extension!

### Cannot find name "Astro" or Property 'env' does not exist on type 'ImportMeta' or Cannot find name "Fragment"

Starting from 0.23.5 version of Astro and the 0.9 version of this extension, typechecking is now done using types that are provided by Astro itself. Therefore, to benefit from those included types, you need to use any version of Astro that is higher or equal to 0.23.5.

If you can't upgrade to a newer version of Astro for the moment, you can downgrade the extension to the latest pre 0.9.0 version by right clicking the Astro extension in the sidebar and pressing "Install another version"

### Inlay Hints don't work

Currently, only inlay hints provided by TypeScript are supported. TypeScript inlay hints are disabled by default and needs to be enabled using the settings under the `typescript.inlayHints` namespace, for example, to enable inlay hints for parameter names, you would do the following:

```json
{
  "typescript.inlayHints.parameterNames.enabled": "all"
}
```

Alternatively, in the GUI this would be in **TypeScript > Inlay Hints > Parameter Names**. Make sure to update the TypeScript settings and not the JavaScript ones, as Astro is TypeScript-only

See [this page](https://code.visualstudio.com/Docs/languages/typescript#_inlay-hints) for more information on the different settings available for inlay hints
