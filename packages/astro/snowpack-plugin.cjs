const { readFile } = require('fs').promises;

// Snowpack plugins must be CommonJS :(
const transformPromise = import('./dist/compiler/index.js');

module.exports = function (snowpackConfig, { resolvePackageUrl, extensions, astroConfig } = {}) {
  return {
    name: 'snowpack-astro',
    knownEntrypoints: [],
    resolve: {
      input: ['.astro', '.md'],
      output: ['.js', '.css'],
    },
    async load({ filePath }) {
      const { compileComponent } = await transformPromise;
      const projectRoot = snowpackConfig.root;
      const contents = await readFile(filePath, 'utf-8');
      const compileOptions = {
        astroConfig,
        resolvePackageUrl,
        extensions,
      };
      const result = await compileComponent(contents, { compileOptions, filename: filePath, projectRoot });
      const output = {
        '.js': result.contents,
      };
      if (result.css) output['.css'] = result.css;
      return output;
    },
  };
};
