export { default } from './plugin/index.js';
export { getAstroMetadata, createDefaultAstroMetadata } from './plugin/metadata.js';
export type { PluginMetadata as AstroPluginMetadata } from './plugin/types.js';
export { CompilerError, CSSError, AggregateError } from './errors.js';
export type { AstroConfigLike, AstroSettingsLike, LoggerLike } from './types.js';
export type { CompileProps, CompileResult } from './compile/index.js';
export { compile } from './compile/index.js';
