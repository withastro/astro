import { Node, Identifier } from 'estree';
export interface Context {
    key: Identifier;
    name?: string;
    modifier: (node: Node) => Node;
    default_modifier: (node: Node, to_ctx: (name: string) => Node) => Node;
}
export declare function unpack_destructuring(contexts: Context[], node: Node, modifier?: Context['modifier'], default_modifier?: Context['default_modifier']): void;
