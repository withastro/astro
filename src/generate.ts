import type { AstroConfig } from './@types/astro';
import { loadConfiguration, startServer as startSnowpackServer } from 'snowpack';
import { promises as fsPromises } from 'fs';
import { relative as pathRelative } from 'path';

const { mkdir, readdir, stat, writeFile } = fsPromises;

async function* allPages(root: URL): AsyncGenerator<URL, void, unknown> {
  for (const filename of await readdir(root)) {
    const fullpath = new URL(filename, root);
    const info = await stat(fullpath);

    if (info.isDirectory()) {
      yield* allPages(new URL(fullpath + '/'));
    } else {
      yield fullpath;
    }
  }
}

export default async function (astroConfig: AstroConfig) {
  const { projectRoot, hmxRoot } = astroConfig;
  const pageRoot = new URL('./pages/', hmxRoot);
  const dist = new URL(astroConfig.dist + '/', projectRoot);

  const configPath = new URL('./snowpack.config.js', projectRoot).pathname;
  const config = await loadConfiguration(
    {
      root: projectRoot.pathname,
      devOptions: { open: 'none', output: 'stream' },
    },
    configPath
  );
  const snowpack = await startSnowpackServer({
    config,
    lockfile: null, // TODO should this be required?
  });

  const runtime = snowpack.getServerRuntime();

  for await (const filepath of allPages(pageRoot)) {
    const rel = pathRelative(hmxRoot.pathname, filepath.pathname); // pages/index.hmx
    const pagePath = `/_hmx/${rel.replace(/\.(hmx|md)/, '.js')}`;

    try {
      const outPath = new URL('./' + rel.replace(/\.(hmx|md)/, '.html'), dist);
      const outFolder = new URL('./', outPath);
      const mod = await runtime.importModule(pagePath);
      const html = await mod.exports.default({});

      await mkdir(outFolder, { recursive: true });
      await writeFile(outPath, html, 'utf-8');
    } catch (err) {
      console.error('Unable to generate page', rel);
    }
  }

  await snowpack.shutdown();
  process.exit(0);
}
