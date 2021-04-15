import type { Node } from 'estree';
import { Parser } from '../index.js';
import { Script } from '../../interfaces.js';
export default function read_script(parser: Parser, start: number, attributes: Node[]): Script;
