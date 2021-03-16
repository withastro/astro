import Node from './shared/Node';
import { Children } from './shared/map_children';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
export default class Title extends Node {
  type: 'Title';
  children: Children;
  should_cache: boolean;
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
