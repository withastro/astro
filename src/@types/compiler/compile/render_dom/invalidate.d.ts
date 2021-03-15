import { Scope } from '../utils/scope';
import { Node } from 'estree';
import Renderer from './Renderer';
export declare function invalidate(renderer: Renderer, scope: Scope, node: Node, names: Set<string>, main_execution_context?: boolean): any;
export declare function renderer_invalidate(renderer: Renderer, name: string, value?: any, main_execution_context?: boolean): any;
