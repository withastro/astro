# vite-plugin-env

Improves Vite's [Env Variables](https://vitejs.dev/guide/env-and-mode.html#env-files) support to include **private** env variables during Server-Side Rendering (SSR) but never in client-side rendering (CSR).

Note that for added security, this plugin does not include **globally available env variable** that exist on `process.env`. It only loads variables defined in your local `.env` files. 

Because of this, `MY_CLI_ARG` will never be added to `import.meta.env` during SSR or CSR.

```shell
MY_CLI_ARG=1 npm run dev
```
