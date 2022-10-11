---
'astro': minor
'@astrojs/node': minor
---

# Adapter support for `astro preview`

Adapters are now about to support the `astro preview` command via a new integration option. The Node.js adapter `@astrojs/node` is the first of the built-in adapters to gain support for this. What this means is that if you are using `@astrojs/node` you can new preview your SSR app by running:

```shell
npm run preview
```

## Adapter API

We will be updating the other first party Astro adapters to support preview over time. Adapters can opt-in to this feature by providing the `previewEntrypoint` via the `setAdapter` function in `astro:config:done` hook. The Node.js adapter's code looks like this:

```diff
export default function() {
  return {
		name: '@astrojs/node',
		hooks: {
			'astro:config:done': ({ setAdapter, config }) => {
        setAdapter({
          name: '@astrojs/node',
          serverEntrypoint: '@astrojs/node/server.js',
+          previewEntrypoint: '@astrojs/node/preview.js',
          exports: ['handler'],
        });

        // more here
      }
    }
  };
}
```

The `previewEntrypoint` is a module in the adapter's package that is a Node.js script. This script is run when `astro preview` is run and is charged with starting up the built server. See the Node.js implementation in `@astrojs/node` to see how that is implemented.
