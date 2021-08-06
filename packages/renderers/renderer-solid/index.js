export default {
  name: '@astrojs/renderer-solid',
  client: './client',
  server: './server',
  external: ['solid-js/web/dist/server.js', 'solid-js/store/dist/server.js', 'solid-js/dist/server.js', 'babel-preset-solid'],
  knownEntrypoints: ['solid-js', 'solid-js/web', 'solid-js/store', 'solid-js/html', 'solid-js/h'],
  jsxImportSource: 'solid-js',
  jsxTransformOptions: async ({ isSSR }) => {
    const [{ default: solid }] = await Promise.all([import('babel-preset-solid')]);
    const options = {
      presets: [solid({}, { generate: isSSR ? 'ssr' : 'dom', hydratable: true })],
      plugins: [],
    };

    if (isSSR) {
      options.plugins.push([
        'babel-plugin-module-resolver',
        {
          cwd: process.cwd(),
          alias: {
            'solid-js': 'solid-js/dist/server.js',
            'solid-js/store': 'solid-js/store/dist/server.js',
            'solid-js/web': 'solid-js/web/dist/server.js',
          },
        },
      ]);
    }

    return options;
  },
};
