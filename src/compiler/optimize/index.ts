import { walk } from 'estree-walker';
import type { Ast, TemplateNode } from '../../parser/interfaces';
import { NodeVisitor, Optimizer, VisitorFn } from '../../@types/optimizer';
import optimizeStyles from './styles.js';

interface VisitorCollection {
  enter: Map<string, VisitorFn[]>;
  leave: Map<string, VisitorFn[]>;
}

function addVisitor(visitor: NodeVisitor, collection: VisitorCollection, nodeName: string, event: 'enter' | 'leave') {
  if (typeof visitor[event] !== 'function') return;
  if (!collection[event]) collection[event] = new Map<string, VisitorFn[]>();

  const visitors = collection[event].get(nodeName) || [];
  visitors.push(visitor[event] as any);
  collection[event].set(nodeName, visitors);
}

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

function createVisitorCollection() {
  return {
    enter: new Map<string, VisitorFn[]>(),
    leave: new Map<string, VisitorFn[]>(),
  };
}

function walkAstWithVisitors(tmpl: TemplateNode, collection: VisitorCollection) {
  walk(tmpl, {
    enter(node) {
      if (collection.enter.has(node.type)) {
        const fns = collection.enter.get(node.type)!;
        for (let fn of fns) {
          fn(node);
        }
      }
    },
    leave(node) {
      if (collection.leave.has(node.type)) {
        const fns = collection.leave.get(node.type)!;
        for (let fn of fns) {
          fn(node);
        }
      }
    },
  });
}

interface OptimizeOptions {
  filename: string;
  fileID: string;
}

export async function optimize(ast: Ast, opts: OptimizeOptions) {
  const htmlVisitors = createVisitorCollection();
  const cssVisitors = createVisitorCollection();
  const finalizers: Array<() => Promise<void>> = [];

  const optimizers = [optimizeStyles(opts)];

  for (const optimizer of optimizers) {
    collectVisitors(optimizer, htmlVisitors, cssVisitors, finalizers);
  }

  walkAstWithVisitors(ast.css, cssVisitors);
  walkAstWithVisitors(ast.html, htmlVisitors);

  // Run all of the finalizer functions in parallel because why not.
  await Promise.all(finalizers.map((fn) => fn()));
}
