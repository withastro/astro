
export interface MagicConfigRaw {
  dist: string;
  projectRoot: string;
  hmxRoot: string;
}

export interface MagicConfig {
  dist: string;
  projectRoot: URL;
  hmxRoot: URL;
}