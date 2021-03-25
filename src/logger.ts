import type { CompileError } from './parser/utils/error.js';
import { bold, blue, red, grey, underline } from 'kleur/colors';
import { Writable } from 'stream';
import { format as utilFormat } from 'util';

type ConsoleStream = Writable & {
  fd: 1 | 2;
};

export const defaultLogDestination = new Writable({
  objectMode: true,
  write(event: LogMessage, _, callback) {
    let dest: ConsoleStream = process.stderr;
    if (levels[event.level] < levels['error']) {
      dest = process.stdout;
    }
    let type = event.type;
    if (event.level === 'info') {
      type = bold(blue(type));
    } else if (event.level === 'error') {
      type = bold(red(type));
    }

    dest.write(`[${type}] `);
    dest.write(utilFormat(...event.args));
    dest.write('\n');

    callback();
  },
});

interface LogWritable<T> extends Writable {
  write: (chunk: T) => boolean;
}

export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'; // same as Pino
export type LoggerEvent = 'debug' | 'info' | 'warn' | 'error';

export interface LogOptions {
  dest: LogWritable<LogMessage>;
  level: LoggerLevel;
}

export const defaultLogOptions: LogOptions = {
  dest: defaultLogDestination,
  level: 'info',
};

export interface LogMessage {
  type: string;
  level: LoggerLevel;
  message: string;
  args: Array<any>;
}

const levels: Record<LoggerLevel, number> = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90,
};

export function log(opts: LogOptions = defaultLogOptions, level: LoggerLevel, type: string, ...args: Array<any>) {
  const event: LogMessage = {
    type,
    level,
    args,
    message: '',
  };

  // test if this level is enabled or not
  if (levels[opts.level] > levels[level]) {
    return; // do nothing
  }

  opts.dest.write(event);
}

export function debug(opts: LogOptions, type: string, ...messages: Array<any>) {
  return log(opts, 'debug', type, ...messages);
}

export function info(opts: LogOptions, type: string, ...messages: Array<any>) {
  return log(opts, 'info', type, ...messages);
}

export function warn(opts: LogOptions, type: string, ...messages: Array<any>) {
  return log(opts, 'warn', type, ...messages);
}

export function error(opts: LogOptions, type: string, ...messages: Array<any>) {
  return log(opts, 'error', type, ...messages);
}

export function parseError(opts: LogOptions, err: CompileError) {
  let frame = err.frame
    // Switch colons for pipes
    .replace(/^([0-9]+)(:)/gm, `${bold('$1')} │`)
    // Make the caret red.
    .replace(/(?<=^\s+)(\^)/gm, bold(red(' ^')))
    // Add identation
    .replace(/^/gm, '   ');

  error(
    opts,
    'parse-error',
    `

 ${underline(bold(grey(`${err.filename}:${err.start.line}:${err.start.column}`)))}
  
 ${bold(red(`𝘅 ${err.message}`))}

${frame}
`
  );
}

// A default logger for when too lazy to pass LogOptions around.
export const logger = {
  debug: debug.bind(null, defaultLogOptions),
  info: info.bind(null, defaultLogOptions),
  warn: warn.bind(null, defaultLogOptions),
  error: error.bind(null, defaultLogOptions),
};
