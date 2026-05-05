// This ?raw import triggers "No loader is configured for .data files" in esbuild
// during SSR dep pre-bundling when the package is not excluded.
import data from './bindings.data?raw';
export default data;
