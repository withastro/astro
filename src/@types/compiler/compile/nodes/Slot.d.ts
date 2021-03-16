import Element from './Element';
import Attribute from './Attribute';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { INode } from './interfaces';
import { TemplateNode } from '../../interfaces';
export default class Slot extends Element {
  type: 'Element';
  name: string;
  children: INode[];
  slot_name: string;
  values: Map<string, Attribute>;
  constructor(component: Component, parent: INode, scope: TemplateScope, info: TemplateNode);
}
