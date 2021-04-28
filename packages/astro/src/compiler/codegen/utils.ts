/**
 * Codegen utils
 */

import type { VariableDeclarator } from '@babel/types';

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

/** Is this an Astro.fetchContent() call? */
export function isFetchContent(declaration: VariableDeclarator): boolean {
  let { init } = declaration;
  if (!init) return false; // definitely not import.meta
  // this could be `await import.meta`; if so, evaluate that:
  if (init.type === 'AwaitExpression') {
    init = init.argument;
  }
  // continue evaluating
  if (
    init.type !== 'CallExpression' ||
    init.callee.type !== 'MemberExpression' ||
    (init.callee.object as any).name !== 'Astro' ||
    (init.callee.property as any).name !== 'fetchContent'
  )
    return false;
  return true;
}
