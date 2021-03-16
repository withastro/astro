import Renderer, { RenderOptions } from '../Renderer';
import SlotTemplate from '../../nodes/SlotTemplate';
import InlineComponent from '../../nodes/InlineComponent';
import Element from '../../nodes/Element';
export default function (
  node: SlotTemplate | Element | InlineComponent,
  renderer: Renderer,
  options: RenderOptions & {
    slot_scopes: Map<any, any>;
  }
): void;
