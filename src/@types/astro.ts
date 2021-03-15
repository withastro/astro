
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