import Node from './shared/Node';
import Expression from './shared/Expression';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
import Element from './Element';
export default class Animation extends Node {
  type: 'Animation';
  name: string;
  expression: Expression;
  constructor(component: Component, parent: Element, scope: TemplateScope, info: TemplateNode);
}
