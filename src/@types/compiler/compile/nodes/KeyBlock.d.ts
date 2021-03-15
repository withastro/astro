import Expression from './shared/Expression';
import AbstractBlock from './shared/AbstractBlock';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
import Node from './shared/Node';
export default class KeyBlock extends AbstractBlock {
    type: 'KeyBlock';
    expression: Expression;
    constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
