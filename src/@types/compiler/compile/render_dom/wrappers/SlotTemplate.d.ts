import Wrapper from './shared/Wrapper';
import Renderer from '../Renderer';
import Block from '../Block';
import FragmentWrapper from './Fragment';
import InlineComponentWrapper from './InlineComponent';
import { INode } from '../../nodes/interfaces';
import Let from '../../nodes/Let';
import TemplateScope from '../../nodes/shared/TemplateScope';
declare type NodeWithLets = INode & {
  scope: TemplateScope;
  lets: Let[];
  slot_template_name: string;
};
export default class SlotTemplateWrapper extends Wrapper {
  node: NodeWithLets;
  fragment: FragmentWrapper;
  block: Block;
  parent: InlineComponentWrapper;
  constructor(renderer: Renderer, block: Block, parent: Wrapper, node: NodeWithLets, strip_whitespace: boolean, next_sibling: Wrapper);
  render(): void;
}
export {};
