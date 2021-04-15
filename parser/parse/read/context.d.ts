import { Parser } from '../index.js';
import { Pattern } from 'estree';
export default function read_context(parser: Parser): Pattern & {
    start: number;
    end: number;
};
