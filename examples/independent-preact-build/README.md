# Astro + Preact Example

```sh
npm create astro@latest -- --template node-independent-build
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/node-independent-build)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/node-independent-build)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/node-independent-build/devcontainer.json)

## Example of independent build

The `isIndependent: true` parameter has been added to the adapter config.

```js
// astro.config.mjs

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
    isIndependent: true,
  }),
});
```

With this option, the output folder will contain everything needed to run your application. Once built, the application can run without the `node_modules` folder.

This option can be used to minimize the size of the Docker image.

### Docker images comparassion

- With the `isIndependent: false` parameter, the docker image with multi-step building occupies 244 MB, of which 109 MB is occupied by the `node_modules` folder
- With the `isIndependent: true` parameter, the docker image occupies 135 MB, of which 119 MB is occupied by the nodejs and ~500 kB by the app.

### Try to compare

```sh
# Build image with node_modules folder
docker build -t astro-with-deps -f Dockerfile.withDeps .

# Build image without dependencies
pnpm install
pnpm run build
docker build -t astro-without-deps -f Dockerfile .

# See image sizes
docker images | grep "^astro-"
# astro-without-deps   191e5842f27b   135MB
# astro-with-deps      ad5d35dae534   244MB

# See more details
docker history astro-with-deps
# COPY /app/dist ./dist                 243kB <-- your app
# ...
# COPY /app/node_modules ./node_modules 109MB <-- your node_modules
# /bin/sh -c addgroup node && addu…     119MB
# /bin/sh -c #(nop) ADD file:6dc…       7.66MB
# ...

docker history astro-without-deps
# COPY /app/dist ./dist # buildkit      541kB <-- your app
# ...
# /bin/sh -c addgroup node && addu…     119MB
# /bin/sh -c #(nop) ADD file:6dc…       7.66MB
# ...
```

### Explanation

Typically, when you build a production image, your image contains a `node_modules` folder with not only the necessary files, but also all the contents of your packages. These could be source-maps, README files, etc. that are not required in production.

With the new option, you can embed into your image only the necessary data that will definitely be used in production.
