import type { AstroConfig } from './@types/astro';
import { join as pathJoin, resolve as pathResolve } from 'path';
import { existsSync } from 'fs';

export async function loadConfig(rawRoot: string | undefined): Promise<AstroConfig | undefined> {
  if (typeof rawRoot === 'undefined') {
    rawRoot = process.cwd();
  }

  const root = pathResolve(rawRoot);
  const fileProtocolRoot = `file://${root}/`;
  const astroConfigPath = pathJoin(root, 'astro.config.mjs');

  if (!existsSync(astroConfigPath)) {
    return undefined;
  }

  const astroConfig: AstroConfig = (await import(astroConfigPath)).default;
  astroConfig.projectRoot = new URL(astroConfig.projectRoot + '/', fileProtocolRoot);
  astroConfig.astroRoot = new URL(astroConfig.astroRoot + '/', fileProtocolRoot);
  return astroConfig;
}
