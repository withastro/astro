import Node from './shared/Node';
import Component from '../Component';
import Block from '../render_dom/Block';
import TemplateScope from './shared/TemplateScope';
import { INode } from './interfaces';
import { TemplateNode } from '../../interfaces';
export default class Fragment extends Node {
    type: 'Fragment';
    block: Block;
    children: INode[];
    scope: TemplateScope;
    constructor(component: Component, info: TemplateNode);
}
