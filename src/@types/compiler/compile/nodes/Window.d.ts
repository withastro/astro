import Node from './shared/Node';
import Binding from './Binding';
import EventHandler from './EventHandler';
import Action from './Action';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
export default class Window extends Node {
  type: 'Window';
  handlers: EventHandler[];
  bindings: Binding[];
  actions: Action[];
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
