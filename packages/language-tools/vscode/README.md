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
- [Symbols](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol) ([outline view](https://code.visualstudio.com/docs/getstarted/userinterface#_outline-view), [breadcrumb navigation](https://code.visualstudio.com/docs/editor/editingevolved#_breadcrumbs), [Go to Symbol](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol) etc)
- [Hover information](https://code.visualstudio.com/Docs/languages/typescript#_hover-information)
- [Go to Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition), [Go to Type Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-type-definition), [Go to Implementation](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-implementation) etc
- [Inlay hints](https://code.visualstudio.com/docs/editor/editingevolved#_inlay-hints)
- [Code folding](https://code.visualstudio.com/docs/editor/codebasics#_folding)
- and more!

A TypeScript plugin adding support for importing and exporting Astro components inside JavaScript and TypeScript files is also included.

## Configuration

HTML, CSS and TypeScript settings can be configured through the `html`, `css` and `typescript` namespaces respectively. For example, HTML documentation on hover can be disabled using `'html.hover.documentation': false`. Formatting can be configured through [Prettier's different configuration methods](https://prettier.io/docs/en/configuration.html).

## Troubleshooting

### Inlay Hints don't work

Currently, only inlay hints provided by TypeScript are supported. TypeScript inlay hints are disabled by default and needs to be enabled using the settings under the `typescript.inlayHints` namespace, for example, to enable inlay hints for parameter names, you would do the following:

```json
{
  "typescript.inlayHints.parameterNames.enabled": "all"
}
```

Alternatively, in the GUI this would be in **TypeScript > Inlay Hints > Parameter Names**. Make sure to update the TypeScript settings and not the JavaScript ones, as Astro is TypeScript-only

See [this page](https://code.visualstudio.com/Docs/languages/typescript#_inlay-hints) for more information on the different settings available for inlay hints
