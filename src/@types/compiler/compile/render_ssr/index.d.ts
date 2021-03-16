import Component from '../Component';
import { CompileOptions, CssResult } from '../../interfaces';
import { Node } from 'estree';
export default function ssr(
  component: Component,
  options: CompileOptions
): {
  js: Node[];
  css: CssResult;
};
