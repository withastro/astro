import Node from './shared/Node';
import Component from '../Component';
import { Identifier } from 'estree';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
export default class Let extends Node {
  type: 'Let';
  name: Identifier;
  value: Identifier;
  names: string[];
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
