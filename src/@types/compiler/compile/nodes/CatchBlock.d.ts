import TemplateScope from './shared/TemplateScope';
import AbstractBlock from './shared/AbstractBlock';
import AwaitBlock from './AwaitBlock';
import Component from '../Component';
import { TemplateNode } from '../../interfaces';
export default class CatchBlock extends AbstractBlock {
  type: 'CatchBlock';
  scope: TemplateScope;
  constructor(component: Component, parent: AwaitBlock, scope: TemplateScope, info: TemplateNode);
}
