import 'source-map-support/register.js';
import type { CompileError } from 'astro-parser';
import { bold, blue, red, grey, underline } from 'kleur/colors';
import { Writable } from 'stream';
import { format as utilFormat } from 'util';
import stringWidth from 'string-width';

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
    if (type !== null) {
      if (event.level === 'info') {
        type = bold(blue(type));
      } else if (event.level === 'error') {
        type = bold(red(type));
      }

      dest.write(`[${type}] `);
    }

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
  type: string | null;
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

/** Full logging API */
export function log(opts: LogOptions = defaultLogOptions, level: LoggerLevel, type: string | null, ...args: Array<any>) {
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

/** Emit a message only shown in debug mode */
export function debug(opts: LogOptions, type: string | null, ...messages: Array<any>) {
  return log(opts, 'debug', type, ...messages);
}

/** Emit a general info message (be careful using this too much!) */
export function info(opts: LogOptions, type: string | null, ...messages: Array<any>) {
  return log(opts, 'info', type, ...messages);
}

/** Emit a warning a user should be aware of */
export function warn(opts: LogOptions, type: string | null, ...messages: Array<any>) {
  return log(opts, 'warn', type, ...messages);
}

/** Emit a fatal error message the user should address. */
export function error(opts: LogOptions, type: string | null, ...messages: Array<any>) {
  return log(opts, 'error', type, ...messages);
}

type LogFn = typeof debug | typeof info | typeof warn | typeof error;

export function table(opts: LogOptions, columns: number[]) {
  return function logTable(logFn: LogFn, ...input: Array<any>) {
    const messages = columns.map((len, i) => padStr(input[i].toString(), len));
    logFn(opts, null, ...messages);
  };
}

/** Pretty format error for display */
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

/** For silencing libraries that go directly to console.warn */
export function trapWarn(cb: (...args: any[]) => void = () => {}) {
  /* eslint-disable no-console */
  const consoleWarn = console.warn;
  console.warn = function (...args: any[]) {
    cb(...args);
  };
  return () => (console.warn = consoleWarn);
}

function padStr(str: string, len: number) {
  const strLen = stringWidth(str);
  if (strLen > len) {
    return str.substring(0, len - 3) + '...';
  }
  const spaces = Array.from({ length: len - strLen }, () => ' ').join('');
  return str + spaces;
}
