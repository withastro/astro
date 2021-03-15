import { Parser } from '../index';
import { Node } from 'estree';
import { Style } from '../../interfaces';
export default function read_style(parser: Parser, start: number, attributes: Node[]): Style;
