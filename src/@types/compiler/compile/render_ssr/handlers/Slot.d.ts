import Renderer, { RenderOptions } from '../Renderer';
import Slot from '../../nodes/Slot';
export default function (node: Slot, renderer: Renderer, options: RenderOptions & {
    slot_scopes: Map<any, any>;
}): void;
