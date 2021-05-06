import type { Ast, TemplateNode } from 'astro-parser';
import type { NodeVisitor, TransformOptions, Transformer, VisitorFn } from '../../@types/transformer';

import { walk } from 'estree-walker';

// Transformers
import transformStyles from './styles.js';
import transformDoctype from './doctype.js';
import transformModuleScripts from './module-scripts.js';
import transformCodeBlocks from './prism.js';

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

/** Compile visitor actions from transformer */
function collectVisitors(transformer: Transformer, htmlVisitors: VisitorCollection, cssVisitors: VisitorCollection, finalizers: Array<() => Promise<void>>) {
  if (transformer.visitors) {
    if (transformer.visitors.html) {
      for (const [nodeName, visitor] of Object.entries(transformer.visitors.html)) {
        addVisitor(visitor, htmlVisitors, nodeName, 'enter');
        addVisitor(visitor, htmlVisitors, nodeName, 'leave');
      }
    }
    if (transformer.visitors.css) {
      for (const [nodeName, visitor] of Object.entries(transformer.visitors.css)) {
        addVisitor(visitor, cssVisitors, nodeName, 'enter');
        addVisitor(visitor, cssVisitors, nodeName, 'leave');
      }
    }
  }
  finalizers.push(transformer.finalize);
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
        const fns = collection.enter.get(node.type) || [];
        for (let fn of fns) {
          fn.call(this, node, parent, key, index);
        }
      }
    },
    leave(node, parent, key, index) {
      if (collection.leave.has(node.type)) {
        const fns = collection.leave.get(node.type) || [];
        for (let fn of fns) {
          fn.call(this, node, parent, key, index);
        }
      }
    },
  });
}

/**
 * Transform
 * Step 2/3 in Astro SSR.
 * Transform is the point at which we mutate the AST before sending off to
 * Codegen, and then to Snowpack. In some ways, it‘s a preprocessor.
 */
export async function transform(ast: Ast, opts: TransformOptions) {
  const htmlVisitors = createVisitorCollection();
  const cssVisitors = createVisitorCollection();
  const finalizers: Array<() => Promise<void>> = [];

  const optimizers = [transformStyles(opts), transformDoctype(opts), transformModuleScripts(opts), transformCodeBlocks(ast.module)];

  for (const optimizer of optimizers) {
    collectVisitors(optimizer, htmlVisitors, cssVisitors, finalizers);
  }

  walkAstWithVisitors(ast.css, cssVisitors);
  walkAstWithVisitors(ast.html, htmlVisitors);

  // Run all of the finalizer functions in parallel because why not.
  await Promise.all(finalizers.map((fn) => fn()));
}
