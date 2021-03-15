import Node from './Node';
import Expression from './Expression';
export default class Tag extends Node {
    type: 'MustacheTag' | 'RawMustacheTag';
    expression: Expression;
    should_cache: boolean;
    constructor(component: any, parent: any, scope: any, info: any);
}
