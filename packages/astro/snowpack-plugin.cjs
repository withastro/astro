const { readFile } = require('fs').promises;

// Snowpack plugins must be CommonJS :(
const transformPromise = import('./dist/compiler/index.js');

module.exports = function (snowpackConfig, { resolvePackageUrl, renderers, astroConfig } = {}) {
  return {
    name: 'snowpack-astro',
    resolve: {
      input: ['.astro', '.md'],
      output: ['.js', '.css'],
    },
    /** 
      * A bit of a hack, but this injects our renderer plugins to the Astro renderer
      * so that we can resolve components at runtime using the renderer
      */
    async transform({contents, fileExt, id }) {
      if (fileExt === '.js' && id.endsWith('/astro/dist/frontend/render-component.js')) {
        const rendererServerPackages = await Promise.all(renderers.map(r => resolvePackageUrl(`${r}`)));
        const rendererClientPackages = await Promise.all(renderers.map(r => resolvePackageUrl(`${r}/client`)));
        const result = `${rendererServerPackages.map((pkg, i) => `import * as __renderer_${i} from '${pkg}';`).join('\n')}
let __rendererSources = [${rendererClientPackages.map(pkg => `"${pkg}"`).join(', ')}];
let __renderers = [${rendererServerPackages.map((_, i) => `__renderer_${i}`).join(', ')}];
${contents}`;
        return result;
      }
    },
    async load({ filePath }) {
      const { compileComponent } = await transformPromise;
      const projectRoot = snowpackConfig.root;
      const contents = await readFile(filePath, 'utf-8');
      const compileOptions = {
        astroConfig,
        resolvePackageUrl,
        renderers,
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
