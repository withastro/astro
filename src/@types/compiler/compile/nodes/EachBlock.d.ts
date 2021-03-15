import ElseBlock from './ElseBlock';
import Expression from './shared/Expression';
import TemplateScope from './shared/TemplateScope';
import AbstractBlock from './shared/AbstractBlock';
import { Context } from './shared/Context';
import { Node } from 'estree';
import Component from '../Component';
import { TemplateNode } from '../../interfaces';
export default class EachBlock extends AbstractBlock {
    type: 'EachBlock';
    expression: Expression;
    context_node: Node;
    iterations: string;
    index: string;
    context: string;
    key: Expression;
    scope: TemplateScope;
    contexts: Context[];
    has_animation: boolean;
    has_binding: boolean;
    has_index_binding: boolean;
    else?: ElseBlock;
    constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
