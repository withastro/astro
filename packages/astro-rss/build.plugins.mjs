import zodCompiler from 'zod-compiler/esbuild';

export default [zodCompiler({ schemas: 'explicit', codegenMode: 'inline' })];
