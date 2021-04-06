import type { TemplateNode } from '../parser/interfaces';
import type { CompileOptions } from './compiler';

export type VisitorFn<T = TemplateNode> = (this: { skip: () => void; remove: () => void; replace: (node: T) => void }, node: T, parent: T, type: string, index: number) => void;

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

export interface OptimizeOptions {
  compileOptions: CompileOptions;
  filename: string;
  fileID: string;
}
