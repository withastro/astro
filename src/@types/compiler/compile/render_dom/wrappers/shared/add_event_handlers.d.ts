import Block from '../../Block';
import EventHandler from '../Element/EventHandler';
import { Expression } from 'estree';
export default function add_event_handlers(block: Block, target: string | Expression, handlers: EventHandler[]): void;
export declare function add_event_handler(block: Block, target: string | Expression, handler: EventHandler): void;
