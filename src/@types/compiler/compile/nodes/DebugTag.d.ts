import Node from './shared/Node';
import Expression from './shared/Expression';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
import { INode } from './interfaces';
export default class DebugTag extends Node {
    type: 'DebugTag';
    expressions: Expression[];
    constructor(component: Component, parent: INode, scope: TemplateScope, info: TemplateNode);
}
