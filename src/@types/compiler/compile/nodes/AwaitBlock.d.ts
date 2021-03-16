import Node from './shared/Node';
import PendingBlock from './PendingBlock';
import ThenBlock from './ThenBlock';
import CatchBlock from './CatchBlock';
import Expression from './shared/Expression';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
import { Context } from './shared/Context';
import { Node as ESTreeNode } from 'estree';
export default class AwaitBlock extends Node {
  type: 'AwaitBlock';
  expression: Expression;
  then_contexts: Context[];
  catch_contexts: Context[];
  then_node: ESTreeNode | null;
  catch_node: ESTreeNode | null;
  pending: PendingBlock;
  then: ThenBlock;
  catch: CatchBlock;
  constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode);
}
