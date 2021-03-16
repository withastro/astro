import Node from './shared/Node';
import Expression from './shared/Expression';
import Component from '../Component';
import { Identifier } from 'estree';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
export default class EventHandler extends Node {
  type: 'EventHandler';
  name: string;
  modifiers: Set<string>;
  expression: Expression;
  handler_name: Identifier;
  uses_context: boolean;
  can_make_passive: boolean;
  constructor(component: Component, parent: Node, template_scope: TemplateScope, info: TemplateNode);
  get reassigned(): boolean;
}
