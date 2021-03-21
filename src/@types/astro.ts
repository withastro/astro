export interface AstroConfigRaw {
  dist: string;
  projectRoot: string;
  hmxRoot: string;
}

export interface AstroConfig {
  dist: string;
  projectRoot: URL;
  hmxRoot: URL;
}

export interface JsxItem {
  name: string;
  jsx: string;
}

export interface TransformResult {
  script: string;
  head: JsxItem | undefined;
  body: JsxItem | undefined;
  items: JsxItem[];
}

export interface CompileResult {
  result: TransformResult;
  contents: string;
}
