import esbuild from 'esbuild';
import config from './esbuild.config.mjs';
import { performance } from 'perf_hooks';

function buildClient() {
  return esbuild.build({
    ...config,
    entryPoints: ['packages/client/src/index.ts'],
    outfile: 'dist/index.js',
  });
}

function buildServer() {
  return esbuild.build({
    ...config,
    entryPoints: ['packages/server/src/index.ts'],
    outfile: 'dist/server.js',
  });
}

async function build() {
  const start = performance.now();
  try {
    await Promise.all([buildClient(), buildServer()]);
  } catch ({ errors }) {
    if (errors[0].text.indexOf('Could not resolve') > -1) {
      console.error('Make sure you run "npm run bootstrap" first!');
    }
    return;
  }
  const end = performance.now();
  const span = end - start;

  console.log(`✨ Built in ${Math.round(span)}ms!`);
}

build();
