import AbstractBlock from './shared/AbstractBlock';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
import Node from './shared/Node';
export default class ElseBlock extends AbstractBlock {
  type: 'ElseBlock';
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
