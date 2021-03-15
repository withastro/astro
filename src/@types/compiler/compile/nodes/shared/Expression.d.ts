import Component from '../../Component';
import { Scope } from '../../utils/scope';
import TemplateScope from './TemplateScope';
import Block from '../../render_dom/Block';
import { Node } from 'estree';
import { INode } from '../interfaces';
declare type Owner = INode;
export default class Expression {
    type: 'Expression';
    component: Component;
    owner: Owner;
    node: Node;
    references: Set<string>;
    dependencies: Set<string>;
    contextual_dependencies: Set<string>;
    template_scope: TemplateScope;
    scope: Scope;
    scope_map: WeakMap<Node, Scope>;
    declarations: Array<(Node | Node[])>;
    uses_context: boolean;
    manipulated: Node;
    constructor(component: Component, owner: Owner, template_scope: TemplateScope, info: Node, lazy?: boolean);
    dynamic_dependencies(): string[];
    manipulate(block?: Block): Node;
}
export {};
