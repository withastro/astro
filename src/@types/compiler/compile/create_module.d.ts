import { ModuleFormat } from '../interfaces';
import { Identifier, ImportDeclaration } from 'estree';
interface Export {
  name: string;
  as: string;
}
export default function create_module(
  program: any,
  format: ModuleFormat,
  name: Identifier,
  banner: string,
  sveltePath: string,
  helpers: Array<{
    name: string;
    alias: Identifier;
  }>,
  globals: Array<{
    name: string;
    alias: Identifier;
  }>,
  imports: ImportDeclaration[],
  module_exports: Export[]
): void;
export {};
