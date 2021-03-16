import { TemplateNode } from '../../interfaces';
import Component from '../Component';
import Node from './shared/Node';
import TemplateScope from './shared/TemplateScope';
export default class Comment extends Node {
  type: 'Comment';
  data: string;
  ignores: string[];
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
