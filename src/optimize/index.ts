import type { Ast, TemplateNode } from '../compiler/interfaces';
import { Optimizer, VisitorFn } from './types';
import { walk } from 'estree-walker';

import optimizeStyles from './styles.js';

interface VisitorCollection {
  enter: Map<string, VisitorFn>;
  leave: Map<string, VisitorFn>;
}

function collectVisitors(optimizer: Optimizer, htmlVisitors: VisitorCollection, cssVisitors: VisitorCollection, finalizers: Array<() => Promise<void>>) {
  if(optimizer.visitors) {
    if(optimizer.visitors.html) {
      for(const [nodeName, visitor] of Object.entries(optimizer.visitors.html)) {
        if(visitor.enter) {
          htmlVisitors.enter.set(nodeName, visitor.enter);
        }
        if(visitor.leave) {
          htmlVisitors.enter.set(nodeName, visitor.leave);
        }
      }
    }
    if(optimizer.visitors.css) {
      for(const [nodeName, visitor] of Object.entries(optimizer.visitors.css)) {
        if(visitor.enter) {
          cssVisitors.enter.set(nodeName, visitor.enter);
        }
        if(visitor.leave) {
          cssVisitors.enter.set(nodeName, visitor.leave);
        }
      }
    }
  }
  finalizers.push(optimizer.finalize);
}

function createVisitorCollection() {
  return {
    enter: new Map<string, VisitorFn>(),
    leave: new Map<string, VisitorFn>(),
  };
}

function walkAstWithVisitors(tmpl: TemplateNode, collection: VisitorCollection) {
  walk(tmpl, {
    enter(node: TemplateNode) {
      if(collection.enter.has(node.type)) {
        const fn = collection.enter.get(node.type)!;
        fn(node);
      }
    },
    leave(node) {
      if(collection.leave.has(node.type)) {
        const fn = collection.leave.get(node.type)!;
        fn(node);
      }
    }
  });
}

interface OptimizeOptions { 
  filename: string,
  fileID: string
}

export async function optimize(ast: Ast, opts: OptimizeOptions) {
  const htmlVisitors = createVisitorCollection();
  const cssVisitors = createVisitorCollection();
  const finalizers: Array<() => Promise<void>> = [];

  collectVisitors(optimizeStyles(opts), htmlVisitors, cssVisitors, finalizers);

  walkAstWithVisitors(ast.html, htmlVisitors);
  walkAstWithVisitors(ast.css, cssVisitors);

  // Run all of the finalizer functions in parallel because why not.
  await Promise.all(finalizers.map(fn => fn()));
}