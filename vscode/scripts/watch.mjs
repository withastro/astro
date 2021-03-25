import esbuild from 'esbuild';

function buildClient() {
  return esbuild.build({
    entryPoints: ['packages/client/src/index.ts'],
    watch: true,
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
    watch: true,
    bundle: true,
    outfile: 'dist/server.js',
    logLevel: 'error',
    platform: 'node',
    format: 'cjs',
    external: ['vscode', 'vscode-html-languageservice'],
  });
}

async function watch() {
  await Promise.all([buildClient(), buildServer()]);
  console.log('👀 Watching for changes...');
}

watch();
