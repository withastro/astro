import { Node } from 'estree';
import { Scope, extract_names, extract_identifiers } from 'periscopic';
export declare function create_scopes(expression: Node): {
    map: WeakMap<Node, Scope>;
    scope: Scope;
    globals: Map<string, Node>;
};
export { Scope, extract_names, extract_identifiers };
