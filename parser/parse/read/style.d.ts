import { Parser } from '../index.js';
import { Style } from '../../interfaces.js';
interface Attribute {
    start: number;
    end: number;
    type: 'Attribute';
    name: string;
    value: {
        raw: string;
        data: string;
    }[];
}
export default function read_style(parser: Parser, start: number, attributes: Attribute[]): Style;
export {};
