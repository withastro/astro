# Astro support for Visual Studio Code

> 🧑‍🚀 Not sure what Astro is? See our website at [astro.build](https://astro.build)!

Provides language support for `.astro` files. This extension is powered by the [Astro language server](https://github.com/withastro/language-tools/tree/main/packages/language-server)

## Features

* [Go to Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition)
* Code hover hints
* Code completion
* Function signatures
* Syntax highlighting
* Code folding
* Emmet

## Configuration

You can disable most features in the extension by going to your workspace settings page. Under __Extension__ find Astro configuration and uncheck the feature you do not want. For example to disable error messages unselect __TypeScript > Diagnostics: Enable__.

## Troubleshooting

### Cannot find name "Astro" or Property 'env' does not exist on type 'ImportMeta' or Cannot find name "Fragment"

Starting from 0.23.5 version of Astro and the 0.9 version of this extension, typechecking is now done using types that are provided by Astro itself. Therefore, to benefit from those included types, you need to use any version of Astro that is higher or equal to 0.23.5

If you can't upgrade to a newer version of Astro for the moment, you can downgrade the extension to the latest pre 0.9.0 version by right clicking the Astro extension in the sidebar and pressing "Install another version"
