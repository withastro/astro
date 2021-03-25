import type { TemplateNode } from '../parser/interfaces';

export type VisitorFn = (node: TemplateNode) => void;

export interface NodeVisitor {
  enter?: VisitorFn;
  leave?: VisitorFn;
}

export interface Optimizer {
  visitors?: {
    html?: Record<string, NodeVisitor>;
    css?: Record<string, NodeVisitor>;
  };
  finalize: () => Promise<void>;
}
