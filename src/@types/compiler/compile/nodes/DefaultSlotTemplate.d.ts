import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import Node from './shared/Node';
import Let from './Let';
import { INode } from './interfaces';
export default class DefaultSlotTemplate extends Node {
  type: 'SlotTemplate';
  scope: TemplateScope;
  children: INode[];
  lets: Let[];
  slot_template_name: string;
  constructor(component: Component, parent: INode, scope: TemplateScope, info: any, lets: Let[], children: INode[]);
}
