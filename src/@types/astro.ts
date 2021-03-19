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
  items: JsxItem[];
}

export interface CompileResult {
  contents: string;
}
