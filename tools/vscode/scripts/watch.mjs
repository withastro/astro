import esbuild from 'esbuild';
import config from './esbuild.config.mjs';

function buildClient() {
  return esbuild.build({
    ...config,
    watch: true,
    entryPoints: ['packages/client/src/index.ts'],
    outfile: 'dist/index.js',
  });
}

function buildServer() {
  return esbuild.build({
    ...config,
    watch: true,
    entryPoints: ['packages/server/src/index.ts'],
    outfile: 'dist/server.js',
  });
}

async function watch() {
  await Promise.all([buildClient(), buildServer()]);
  console.log('👀 Watching for changes...');
}

watch();
