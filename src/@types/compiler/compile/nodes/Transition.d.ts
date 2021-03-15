import Node from './shared/Node';
import Expression from './shared/Expression';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
import Element from './Element';
export default class Transition extends Node {
    type: 'Transition';
    name: string;
    directive: string;
    expression: Expression;
    is_local: boolean;
    constructor(component: Component, parent: Element, scope: TemplateScope, info: TemplateNode);
}
