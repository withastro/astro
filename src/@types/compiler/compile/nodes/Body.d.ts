import Node from './shared/Node';
import EventHandler from './EventHandler';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
export default class Body extends Node {
  type: 'Body';
  handlers: EventHandler[];
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
