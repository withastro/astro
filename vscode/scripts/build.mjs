import esbuild from 'esbuild';
import { performance } from 'perf_hooks';

function buildClient() {
  return esbuild.build({
    entryPoints: ['packages/client/src/index.ts'],
    bundle: true,
    outfile: 'dist/index.js',
    logLevel: 'error',
    platform: 'node',
    format: 'cjs',
    external: ['vscode', 'vscode-html-languageservice'],
  });
}

function buildServer() {
  return esbuild.build({
    entryPoints: ['packages/server/src/index.ts'],
    logLevel: 'error',
    bundle: true,
    outfile: 'dist/server.js',
    platform: 'node',
    format: 'cjs',
    external: ['vscode', 'vscode-html-languageservice'],
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
