
const nodeBuiltinsBare = [
  'async_hooks',
  'child_process',
  'cluster',
  'crypto',
  'diagnostics_channel',
  'dns',
  'events',
  'fs',
  'http',
  'https',
  'http2',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'querystring',
  'readline',
  'stream',
  'string_decoder',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib'
];

export const nodeBuiltinsSet = new Set(nodeBuiltinsBare);
export const nodeBuiltinsMap = new Map(nodeBuiltinsBare.map(bareName => [bareName, 'node:' + bareName]));