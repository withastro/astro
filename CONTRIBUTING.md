# Contributing

> See the [overview video](https://www.loom.com/share/609f7b61795349328730f14e1ae2166e) on how the extension works.

## Setup

All Astro projects use Yarn and [Turbo](https://turborepo.org/) to enable development in a monorepo. Once you've cloned the project install dependencies and do an initial build:

```shell
yarn
yarn build
```

## Debugging

During the normal course of development on the VSCode extension you'll want to run the debugger. First run the build in watch mode with:

```shell
yarn dev
```

### Turn Off Extension

If you have the Extension installed you'll need to turn it off, or your development extension will not be used and you'll be confused why your changes are not working.

1. Click on __Extensions__.
2. Search for *astro*.
3. Click the extension and then click __Disable__.

<img width="1530" alt="Show the steps of disabling the extension" src="https://user-images.githubusercontent.com/361671/130800518-177b2e9f-f2e0-46ff-adac-31ff099b67fe.png">

### Start Debugger

Then in VSCode:

1. Switch to __Run and Debug__.
2. Click __Launch Extension__.

<img width="406" alt="Showing the steps to launching the debugger" src="https://user-images.githubusercontent.com/361671/130799724-aa724b67-9d15-4c79-8ff5-0b90e398e147.png">

This will launch a new window for your editor. Here you can navigate to a test Astro project that you will use to develop your changes.

### Open Debug Console

The Debug console in the main editor is where you will get logging information. When developing in the language server, logging is helpful to figure out what is going on.

1. Ctrl+Shift+P (CMD+Shift+P on OSX) opens the command palette.
2. Select __Debug Console__.
3. At the bottom, switch to __Attach to Server__. This is most of the information you'll want to see.

<img width="1628" alt="Steps to open the command palette" src="https://user-images.githubusercontent.com/361671/130805127-83e3935f-39a3-435d-9116-64eb53e115f4.png">

### Make changes and set breakpoints

Now you can start developing your changes. You can set breakpoints or add `debugger;` statements. To see your changes reflect you'll need to take these steps:

1. In the extension editor window, go to __Run and Debug__ if you are not already there.
2. Click on the __Restart__ button under __Launch Client__.

This will restart the extension and reload your test window.

<img width="406" alt="Shows how to restart the extension" src="https://user-images.githubusercontent.com/361671/130806011-c36b6b50-d2f1-4ef3-a2da-ca7e9ab2a8fe.png">
