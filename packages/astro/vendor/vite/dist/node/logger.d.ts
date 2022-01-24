/// <reference types="node" />
import { Server } from 'net';
import { RollupError } from 'rollup';
import { ResolvedConfig } from '.';
import { CommonServerOptions } from './http';
export declare type LogType = 'error' | 'warn' | 'info';
export declare type LogLevel = LogType | 'silent';
export interface Logger {
    info(msg: string, options?: LogOptions): void;
    warn(msg: string, options?: LogOptions): void;
    warnOnce(msg: string, options?: LogOptions): void;
    error(msg: string, options?: LogErrorOptions): void;
    clearScreen(type: LogType): void;
    hasErrorLogged(error: Error | RollupError): boolean;
    hasWarned: boolean;
}
export interface LogOptions {
    clear?: boolean;
    timestamp?: boolean;
}
export interface LogErrorOptions extends LogOptions {
    error?: Error | RollupError | null;
}
export declare const LogLevels: Record<LogLevel, number>;
export interface LoggerOptions {
    prefix?: string;
    allowClearScreen?: boolean;
    customLogger?: Logger;
}
export declare function createLogger(level?: LogLevel, options?: LoggerOptions): Logger;
/**
 * @deprecated Use `server.printUrls()` instead
 */
export declare function printHttpServerUrls(server: Server, config: ResolvedConfig): void;
export declare function printCommonServerUrls(server: Server, options: CommonServerOptions, config: ResolvedConfig): void;
