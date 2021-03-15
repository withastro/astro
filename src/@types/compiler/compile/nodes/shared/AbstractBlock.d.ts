import Block from '../../render_dom/Block';
import Component from '../../Component';
import Node from './Node';
import { INode } from '../interfaces';
export default class AbstractBlock extends Node {
    block: Block;
    children: INode[];
    constructor(component: Component, parent: any, scope: any, info: any);
    warn_if_empty_block(): void;
}
