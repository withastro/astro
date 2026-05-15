import type { Arguments } from 'yargs-parser';
import type { AstroLogger } from '../core/logger/core.js';
import type { AstroInlineConfig } from '../types/public/config.js';
export type Flags = Arguments;
/** @deprecated Use AstroConfigResolver instead */
export declare function flagsToAstroInlineConfig(flags: Flags): AstroInlineConfig;
/**
 * The `logging` is usually created from an `AstroInlineConfig`, but some flows like `add`
 * doesn't read the AstroConfig directly, so we create a `logging` object from the CLI flags instead.
 */
export declare function createLoggerFromFlags(flags: Flags): AstroLogger;
