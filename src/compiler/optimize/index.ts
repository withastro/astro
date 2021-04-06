import type { Ast, TemplateNode } from '../../parser/interfaces';
import type { NodeVisitor, OptimizeOptions, Optimizer, VisitorFn } from '../../@types/optimizer';

import { walk } from 'estree-walker';

// Optimizers
import optimizeStyles from './styles.js';
import optimizeDoctype from './doctype.js';
import optimizeModuleScripts from './module-scripts.js';
import optimizeCodeBlocks from './prism.js';

interface VisitorCollection {
  enter: Map<string, VisitorFn[]>;
  leave: Map<string, VisitorFn[]>;
}

/** Add visitors to given collection */
function addVisitor(visitor: NodeVisitor, collection: VisitorCollection, nodeName: string, event: 'enter' | 'leave') {
  if (typeof visitor[event] !== 'function') return;
  if (!collection[event]) collection[event] = new Map<string, VisitorFn[]>();

  const visitors = collection[event].get(nodeName) || [];
  visitors.push(visitor[event] as any);
  collection[event].set(nodeName, visitors);
}

/** Compile visitor actions from optimizer */
function collectVisitors(optimizer: Optimizer, htmlVisitors: VisitorCollection, cssVisitors: VisitorCollection, finalizers: Array<() => Promise<void>>) {
  if (optimizer.visitors) {
    if (optimizer.visitors.html) {
      for (const [nodeName, visitor] of Object.entries(optimizer.visitors.html)) {
        addVisitor(visitor, htmlVisitors, nodeName, 'enter');
        addVisitor(visitor, htmlVisitors, nodeName, 'leave');
      }
    }
    if (optimizer.visitors.css) {
      for (const [nodeName, visitor] of Object.entries(optimizer.visitors.css)) {
        addVisitor(visitor, cssVisitors, nodeName, 'enter');
        addVisitor(visitor, cssVisitors, nodeName, 'leave');
      }
    }
  }
  finalizers.push(optimizer.finalize);
}

/** Utility for formatting visitors */
function createVisitorCollection() {
  return {
    enter: new Map<string, VisitorFn[]>(),
    leave: new Map<string, VisitorFn[]>(),
  };
}

/** Walk AST with collected visitors */
function walkAstWithVisitors(tmpl: TemplateNode, collection: VisitorCollection) {
  walk(tmpl, {
    enter(node, parent, key, index) {
      if (collection.enter.has(node.type)) {
        const fns = collection.enter.get(node.type)!;
        for (let fn of fns) {
          fn.call(this, node, parent, key, index);
        }
      }
    },
    leave(node, parent, key, index) {
      if (collection.leave.has(node.type)) {
        const fns = collection.leave.get(node.type)!;
        for (let fn of fns) {
          fn.call(this, node, parent, key, index);
        }
      }
    },
  });
}

/**
 * Optimize
 * Step 2/3 in Astro SSR.
 * Optimize is the point at which we mutate the AST before sending off to
 * Codegen, and then to Snowpack. In some ways, it‘s a preprocessor.
 */
export async function optimize(ast: Ast, opts: OptimizeOptions) {
  const htmlVisitors = createVisitorCollection();
  const cssVisitors = createVisitorCollection();
  const finalizers: Array<() => Promise<void>> = [];

  const optimizers = [optimizeStyles(opts), optimizeDoctype(opts), optimizeModuleScripts(opts), optimizeCodeBlocks(ast.module)];

  for (const optimizer of optimizers) {
    collectVisitors(optimizer, htmlVisitors, cssVisitors, finalizers);
  }

  walkAstWithVisitors(ast.css, cssVisitors);
  walkAstWithVisitors(ast.html, htmlVisitors);

  // Run all of the finalizer functions in parallel because why not.
  await Promise.all(finalizers.map((fn) => fn()));
}
