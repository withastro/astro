import { walk, asyncWalk } from 'estree-walker';
import type { Ast, TemplateNode } from '../compiler/interfaces';
import { NodeVisitor, Optimizer, VisitorFn } from '../@types/optimizer';
import { StyleTransformResult, transformStyle } from './style.js';

interface VisitorCollection {
  enter: Map<string, VisitorFn[]>;
  leave: Map<string, VisitorFn[]>;
}

function addVisitor(visitor: NodeVisitor, collection: VisitorCollection, nodeName: string, event: 'enter' | 'leave') {
  if (event in visitor) {
    if (collection[event].has(nodeName)) {
      collection[event].get(nodeName)!.push(visitor[event]!);
    }

    collection.enter.set(nodeName, [visitor[event]!]);
  }
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
  try {
    const classNames: Set<string> = new Set();
    const allCssModules: Map<string, string> = new Map();
    let hasStyles = false;

    // 1. collect all CSS classes in HTML. Must be completely done before styles are parsed.
    walk(ast.html, {
      enter(node) {
        if (node.type !== 'Element') return;
        for (let attr of node.attributes) {
          if (attr.name !== 'class') continue;
          for (let value of attr.value) {
            if (value.type !== 'Text') continue;
            (value.data as string)
              .split(' ')
              .map((c) => c.trim())
              .forEach((c) => classNames.add(c));
          }
        }
      },
    });

    // 2. parse styles
    await asyncWalk(ast.css, {
      async enter(node: TemplateNode) {
        if (node.type !== 'Style') return;
        // TODO: check for top-level <style> tag; ignore within component

        hasStyles = true; // some ASTs don’t have any styles; skip step 3 if so
        const code = node.content.styles;
        const typeAttr = node.attributes && node.attributes.find(({ name }: { name: string }) => name === 'type');

        // 1. transform styles
        const result = await transformStyle(code, {
          type: (typeAttr.value[0] && typeAttr.value[0].raw) || undefined,
          classNames,
          filename: opts.filename,
          fileID: opts.fileID,
        });

        // 2. save cssModule names for updating HTML below
        for (const [k, v] of result.cssModules) {
          allCssModules.set(k, v);
        }

        // 3. Update CSS AST (including <style type="">)
        node.content.styles = result.css;
        if (result.type !== 'text/css') {
          for (let i = 0; i < node.attributes.length; i++) {
            if (node.attributes[i].name !== 'type') continue;
            for (let j = 0; j < node.attributes[i].value.length; j++) {
              node.attributes[i].value[j].raw = 'text/css';
              node.attributes[i].value[j].data = 'text/css';
            }
          }
        }

        this.replace(node);
      },
    });

    // 3. Update HTML with new local classnames and inject styles
    if (hasStyles) {
      if (allCssModules.size) {
        walk(ast.html, {
          enter(node) {
            if (node.type === 'Element') {
              for (let i = 0; i < node.attributes.length; i++) {
                if (node.attributes[i].name !== 'class') continue;
                for (let j = 0; j < node.attributes[i].value.length; j++) {
                  if (node.attributes[i].value[j].type !== 'Text') continue;
                  const elementClassNames = (node.attributes[i].value[j].raw as string)
                    .split(' ')
                    .map((c) => {
                      let className = c.trim();
                      return allCssModules.get(className) || className;
                    })
                    .join(' ');
                  node.attributes[i].value[j].raw = elementClassNames;
                  node.attributes[i].value[j].data = elementClassNames;
                }
              }
              this.replace(node);
            }
          },
        });
      }
    }

    // Done! The classNames are updated in the HTML, but we’ll inject the styles later
  } catch (err) {
    console.error(err);
  }
}
