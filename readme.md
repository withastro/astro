# Astro Language Tools

This repository contains tooling for the [Astro](https://astro.build/) language, powering the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode). The packages included are:

* The Astro VSCode Extension
* The Astro Language Server

This enables all of the editing features you depend on in VSCode. Any time you open a `.astro` file these tools power editing functionality such as:

* [Go to Definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition)
* Code hover hints
* Code completion
* Function signatures
* Syntax highlighting
* Code folding
* Emmet

Soon we hope to port these to other editors compatible with the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/).

## Development

Changes to the Astro Language Tools are subject to [Astro Governance](https://github.com/snowpackjs/astro/blob/main/GOVERNANCE.md).

### Setup

All Astro projects use Yarn and [Lerna](https://lerna.js.org/) to enable development in a monorepo. Once you've cloned the project install dependencies and do an initial build:

```shell
yarn
yarn build
```

### Debugging

During the normal course of development on the VSCode extension you'll want to run the debugger. First run the build in watch mode with:

```shell
yarn dev
```

#### Turn Off Extension

If you have the Extension installed you'll need to turn it off, or your development extension will not be used and you'll be confused why your changes are not working.

1. Click on __Extensions__.
2. Search for *astro*.
3. Click the extension and then click __Disable__.

<img width="1530" alt="Show the steps of disabling the extension" src="https://user-images.githubusercontent.com/361671/130800518-177b2e9f-f2e0-46ff-adac-31ff099b67fe.png">

#### Start Debugger

Then in VSCode:

1. Switch to __Run and Debug__.
2. Click __Launch Extension__.

<img width="406" alt="Showing the steps to launching the debugger" src="https://user-images.githubusercontent.com/361671/130799724-aa724b67-9d15-4c79-8ff5-0b90e398e147.png">
