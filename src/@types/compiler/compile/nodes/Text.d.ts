import Node from './shared/Node';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { INode } from './interfaces';
import { TemplateNode } from '../../interfaces';
export default class Text extends Node {
    type: 'Text';
    data: string;
    synthetic: boolean;
    constructor(component: Component, parent: INode, scope: TemplateScope, info: TemplateNode);
    should_skip(): any;
}
