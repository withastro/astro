import { Parser } from '../index';
import { Pattern } from 'estree';
export default function read_context(
  parser: Parser
): Pattern & {
  start: number;
  end: number;
};
