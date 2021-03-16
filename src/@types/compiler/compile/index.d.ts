import { CompileOptions, Warning } from '../interfaces';
export default function compile(
  source: string,
  options?: CompileOptions
): {
  js: any;
  css: any;
  ast: import('../interfaces').Ast;
  warnings: Warning[];
  vars: {
    name: string;
    export_name: string;
    injected: boolean;
    module: boolean;
    mutated: boolean;
    reassigned: boolean;
    referenced: boolean;
    writable: boolean;
    referenced_from_script: boolean;
  }[];
  stats: {
    timings: {
      total: number;
    };
  };
};
