/**
 * Codegen utils
 */

import type { VariableDeclarator, CallExpression } from '@babel/types';
import type { Attribute } from './interfaces';
import type { LogOptions } from '../../logger';
import { warn } from '../../logger.js';

/** Is this an import.meta.* built-in? You can pass an optional 2nd param to see if the name matches as well. */
export function isImportMetaDeclaration(declaration: VariableDeclarator, metaName?: string): boolean {
  let { init } = declaration;
  if (!init) return false; // definitely not import.meta
  // this could be `await import.meta`; if so, evaluate that:
  if (init.type === 'AwaitExpression') {
    init = init.argument;
  }
  // continue evaluating
  if (init.type !== 'CallExpression' || init.callee.type !== 'MemberExpression' || init.callee.object.type !== 'MetaProperty') return false;
  // optional: if metaName specified, match that
  if (metaName && (init.callee.property.type !== 'Identifier' || init.callee.property.name !== metaName)) return false;
  return true;
}

const warnableRelativeValues = new Set(['img+src', 'a+href', 'script+src', 'link+href', 'source+srcset']);

const matchesRelative = /^(?![A-Za-z][+-.0-9A-Za-z]*:|\/)/;

export function warnIfRelativeStringLiteral(logging: LogOptions, nodeName: string, attr: Attribute, value: string) {
  let key = nodeName + '+' + attr.name;
  if (warnableRelativeValues.has(key) && matchesRelative.test(value)) {
    let message = `This value will be resolved relative to the page: <${nodeName} ${attr.name}="${value}">`;
    warn(logging, 'relative-link', message);
  }
}
