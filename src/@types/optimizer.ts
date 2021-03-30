import type { TemplateNode } from '../parser/interfaces';

export type VisitorFn = (node: TemplateNode, parent: TemplateNode, type: string, index: number) => void;

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
