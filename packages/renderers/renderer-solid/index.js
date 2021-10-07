export default {
  name: '@astrojs/renderer-solid',
  client: './client.js',
  server: './server.js',
  knownEntrypoints: ['solid-js', 'solid-js/web', 'solid-js/store', 'solid-js/html', 'solid-js/h'],
  external: ['solid-js/web/dist/server.cjs', 'solid-js/store/dist/server.cjs', 'solid-js/dist/server.cjs', 'babel-preset-solid'],
  jsxImportSource: 'solid-js',
  jsxTransformOptions: async ({ isSSR }) => {
    const [{ default: solid }] = await Promise.all([import('babel-preset-solid')]);
    const options = {
      presets: [solid({}, { generate: isSSR ? 'ssr' : 'dom' })],
      plugins: [],
    };

    if (isSSR) {
      options.plugins.push([
        'babel-plugin-module-resolver',
        {
          cwd: process.cwd(),
          alias: {
            'solid-js/store': 'solid-js/store/dist/server.cjs',
            'solid-js/web': 'solid-js/web/dist/server.cjs',
            'solid-js': 'solid-js/dist/server.cjs',
          },
        },
      ]);
    }

    return options;
  },
};
