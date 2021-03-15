import Node from './shared/Node';
import Expression from './shared/Expression';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { Directive } from '../../interfaces';
export default class Action extends Node {
    type: 'Action';
    name: string;
    expression: Expression;
    uses_context: boolean;
    template_scope: TemplateScope;
    constructor(component: Component, parent: Node, scope: TemplateScope, info: Directive);
}
