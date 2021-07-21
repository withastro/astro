export default {
  name: '@astrojs/renderer-solid',
  client: './client',
  server: './server',
  knownEntrypoints: ['solid-js', 'solid-js/web'],
  external: ['solid-js/web/dist/server.js', 'solid-js/dist/server.js', 'babel-preset-solid'],
  jsxImportSource: 'solid-js',
  jsxTransformOptions: async ({ isSSR }) => {
    const [{ default: solid }] = await Promise.all([import('babel-preset-solid')]);
    const options = {
      presets: [
        solid({}, { generate: isSSR ? 'ssr' : 'dom' }),
      ]
    }

    if (isSSR) {
      options.alias = {
        'solid-js/web': 'solid-js/web/dist/server.js',
        'solid-js': 'solid-js/dist/server.js',
      };
    }

    return options;
  }
};
