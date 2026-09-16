# Testing syntax files

This is a testing setup powered by [vscode-tmgrammar-test](https://github.com/PanAeon/vscode-tmgrammar-test) intended to test our `astro.tmLanguage.json` file to make sure it properly handle `.astro` files. To run it, simply run the `test:grammar` npm script from the repo

[Snapshots](https://github.com/PanAeon/vscode-tmgrammar-test#snapshot-tests) can be updated using the `update-grammar-snapshots` npm script, however, unless your changes affect the currently present snapshots, you should always make sure to run the tests (`pnpm test:grammar`) before updating the snapshots, to make sure your changes do not introduce regressions
