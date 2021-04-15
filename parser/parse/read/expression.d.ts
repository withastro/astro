import type { Expression } from '../../interfaces';
import { Parser } from '../index.js';
export declare const parse_expression_at: (source: string, index: number) => Expression;
export default function read_expression(parser: Parser): Expression;
