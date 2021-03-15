import { PreprocessorGroup, Processed } from './types';
export default function preprocess(source: string, preprocessor: PreprocessorGroup | PreprocessorGroup[], options?: {
    filename?: string;
}): Promise<Processed>;
