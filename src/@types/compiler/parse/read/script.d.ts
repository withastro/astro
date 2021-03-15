import { Parser } from '../index';
import { Script } from '../../interfaces';
import { Node } from 'estree';
export default function read_script(parser: Parser, start: number, attributes: Node[]): Script;
