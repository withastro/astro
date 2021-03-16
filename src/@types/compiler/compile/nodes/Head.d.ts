import Node from './shared/Node';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
export default class Head extends Node {
  type: 'Head';
  children: any[];
  id: string;
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
