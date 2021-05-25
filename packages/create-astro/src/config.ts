import type * as arg from 'arg';
import decamelize from 'decamelize';

export interface ARG {
  type: any;
  description: string;
  enum?: string[];
  alias?: string;
}

export const ARGS: Record<string, ARG> = {
  template: {
    type: String,
    description: 'specifies template to use',
  },
  use: {
    type: String,
    enum: ['npm', 'yarn'],
    description: 'specifies package manager to use',
  },
  skipInstall: {
    type: Boolean,
    description: 'should installing dependencies be skipped?',
  },
  force: {
    type: Boolean,
    alias: 'f',
    description: 'should existing files be overwritten?',
  },
  version: {
    type: Boolean,
    alias: 'v',
    description: 'prints current version',
  },
  help: {
    type: Boolean,
    alias: 'h',
    description: 'prints this message',
  },
};

export const args = Object.entries(ARGS).reduce((acc, [name, info]) => {
  const key = `--${decamelize(name, { separator: '-' })}`;
  const spec = { ...acc, [key]: info.type };

  if (info.alias) {
    spec[`-${info.alias}`] = key;
  }
  return spec;
}, {} as arg.Spec);
