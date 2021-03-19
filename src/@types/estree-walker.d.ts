import { BaseNode } from 'estree-walker';

declare module 'estree-walker' {
  export function walk<T = BaseNode>(
    ast: T,
    {
      enter,
      leave,
    }: {
      enter?: (this: { skip: () => void; remove: () => void; replace: (node: T) => void }, node: T, parent: T, key: string, index: number) => void;
      leave?: (this: { skip: () => void; remove: () => void; replace: (node: T) => void }, node: T, parent: T, key: string, index: number) => void;
    }
  ): T;

  export function asyncWalk<T = BaseNode>(
    ast: T,
    {
      enter,
      leave,
    }: {
      enter?: (this: { skip: () => void; remove: () => void; replace: (node: T) => void }, node: T, parent: T, key: string, index: number) => void;
      leave?: (this: { skip: () => void; remove: () => void; replace: (node: T) => void }, node: T, parent: T, key: string, index: number) => void;
    }
  ): T;
}
