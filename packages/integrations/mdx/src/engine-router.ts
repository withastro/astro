/**
 * MDX Engine Router - Routes compilation between Rust hybrid bridge and JS engines
 * 
 * @module engine-router
 */

import type { VFile } from 'vfile'
import type { SourceMapGenerator } from 'source-map'

/**
 * Engine mode selection
 */
export type EngineMode = 'rust' | 'js'

/**
 * Post-transform stage indicator for downstream Vite processing
 */
export type PostTransformStage = 'jsx' | 'js'

/**
 * Plugin type for remark/rehype ecosystem
 */
export type PluggableList = Array<any> // Would be unified.PluggableList in real implementation

/**
 * Timing metrics for compilation stages
 */
export interface TimingMetrics {
  /** Time spent parsing MDX to MDAST (ms) */
  parseMs?: number
  /** Time spent running remark/rehype plugins (ms) */
  pluginMs?: number
  /** Time spent generating code from MDAST (ms) */
  codegenMs?: number
  /** Total compilation time (ms) */
  totalMs?: number
}

/**
 * Engine capabilities configuration
 */
export interface EngineCapabilities {
  /** Whether Rust engine binaries are available */
  rustAvailable: boolean
  /** Whether Rust bridge (parse + codegen) is available */
  rustBridgeAvailable: boolean
}

/**
 * Compilation options for MDX processing
 */
export interface CompileOptions {
  /** Source file path for source map generation */
  filename: string
  /** MDX content to compile */
  value: string
  /** Engine mode selection */
  mode: EngineMode
  /** JSX runtime to use ('automatic' | 'classic') */
  jsxRuntime?: 'automatic' | 'classic'
  /** JSX import source (e.g., 'react', 'preact') */
  jsxImportSource?: string
  /** Enable development mode optimizations */
  development?: boolean
  /** Generate source maps */
  sourceMap?: boolean
  /** Allow dangerous HTML in markdown */
  allowDangerousHtml?: boolean
  /** Allow dangerous protocols in URLs */
  allowDangerousProtocol?: boolean
  /** Enable GitHub Flavored Markdown */
  gfm?: boolean
  /** Enable footnotes extension */
  footnotes?: boolean
  /** Remark plugins to apply */
  remarkPlugins?: PluggableList
  /** Rehype plugins to apply */
  rehypePlugins?: PluggableList
}

/**
 * Compilation result with metadata
 */
export interface CompileResult {
  /** Compiled JavaScript code */
  code: string
  /** Source map (VLQ encoded with embedded sourcesContent) */
  map?: string | SourceMapGenerator
  /** VFile data from compilation */
  data?: VFile['data']
  /** Timing metrics for performance analysis */
  timing?: TimingMetrics
  /** Engine that was used for compilation */
  engine: EngineMode
  /** Post-transform stage for downstream processing */
  postTransformStage: PostTransformStage
  /** Compilation warnings */
  warnings?: string[]
}

/**
 * Error thrown when Rust engine is requested but not available
 */
export class RustUnavailableError extends Error {
  constructor(message?: string) {
    super(message || 'Rust engine requested but not available')
    this.name = 'RustUnavailableError'
  }
}

/**
 * MDAST (Markdown Abstract Syntax Tree) type
 */
interface MdastNode {
  type: string
  children?: MdastNode[]
  [key: string]: any
}

/**
 * Creates an engine router with specified capabilities
 * 
 * @param capabilities - Engine availability configuration
 * @returns Engine router instance with compile methods
 * 
 * @example
 * ```typescript
 * const router = createEngineRouter({
 *   rustAvailable: true,
 *   rustBridgeAvailable: true
 * })
 * 
 * const result = await router.compile({
 *   filename: 'example.mdx',
 *   value: '# Hello MDX',
 *   mode: 'rust',
 *   remarkPlugins: [remarkGfm],
 *   rehypePlugins: [rehypeHighlight]
 * })
 * ```
 */
export function createEngineRouter(capabilities: EngineCapabilities) {
  /**
   * Compiles MDX using the Rust hybrid bridge pipeline
   */
  async function compileWithRustBridge(options: CompileOptions): Promise<CompileResult> {
    const startTime = performance.now()
    const warnings: string[] = []
    
    // Step 1: Parse MDX to MDAST using Rust
    const parseStart = performance.now()
    const mdastJson = await rustParseToMdastJSON(options.value, {
      filename: options.filename,
      gfm: options.gfm,
      footnotes: options.footnotes,
      allowDangerousHtml: options.allowDangerousHtml,
      allowDangerousProtocol: options.allowDangerousProtocol
    })
    const parseMs = performance.now() - parseStart
    
    // Step 2: Apply remark/rehype plugins in JavaScript
    const pluginStart = performance.now()
    const mdast = JSON.parse(mdastJson) as MdastNode
    const processedMdast = await applyPluginsInJS(mdast, {
      remarkPlugins: options.remarkPlugins || [],
      rehypePlugins: options.rehypePlugins || []
    })
    const pluginMs = performance.now() - pluginStart
    
    // Step 3: Generate code from MDAST using Rust
    const codegenStart = performance.now()
    const { code, map } = await rustCodegenFromMdast(JSON.stringify(processedMdast), {
      filename: options.filename,
      jsxRuntime: options.jsxRuntime,
      jsxImportSource: options.jsxImportSource,
      development: options.development,
      sourceMap: options.sourceMap,
      embedSourcesContent: true // Always embed for VLQ maps
    })
    const codegenMs = performance.now() - codegenStart
    
    const totalMs = performance.now() - startTime
    
    return {
      code,
      map: options.sourceMap ? map : undefined,
      timing: {
        parseMs,
        pluginMs,
        codegenMs,
        totalMs
      },
      engine: 'rust',
      postTransformStage: 'js', // Rust codegen produces JS, not JSX
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }
  
  /**
   * Compiles MDX using the JavaScript engine
   */
  async function compileWithJS(options: CompileOptions): Promise<CompileResult> {
    const startTime = performance.now()
    
    const result = await jsMdxCompile(options.value, {
      filepath: options.filename,
      development: options.development,
      jsxRuntime: options.jsxRuntime,
      jsxImportSource: options.jsxImportSource,
      remarkPlugins: options.remarkPlugins,
      rehypePlugins: options.rehypePlugins,
      format: 'mdx',
      outputFormat: 'function-body',
      providerImportSource: undefined,
      allowDangerousHtml: options.allowDangerousHtml,
      allowDangerousProtocol: options.allowDangerousProtocol,
      remarkRehypeOptions: {
        allowDangerousHtml: options.allowDangerousHtml
      }
    })
    
    const totalMs = performance.now() - startTime
    
    return {
      code: String(result.value),
      map: result.map,
      data: result.data,
      timing: {
        totalMs
      },
      engine: 'js',
      postTransformStage: 'jsx', // JS engine outputs JSX
      warnings: undefined
    }
  }
  
  /**
   * Synchronous compilation (if bindings support it)
   */
  function compileSync(options: CompileOptions): CompileResult {
    if (options.mode === 'rust') {
      if (!capabilities.rustBridgeAvailable) {
        throw new RustUnavailableError('Rust bridge not available for synchronous compilation')
      }
      
      const startTime = performance.now()
      const warnings: string[] = []
      
      // Step 1: Parse
      const parseStart = performance.now()
      const mdastJson = rustParseToMdastJSONSync(options.value, {
        filename: options.filename,
        gfm: options.gfm,
        footnotes: options.footnotes,
        allowDangerousHtml: options.allowDangerousHtml,
        allowDangerousProtocol: options.allowDangerousProtocol
      })
      const parseMs = performance.now() - parseStart
      
      // Step 2: Plugins
      const pluginStart = performance.now()
      const mdast = JSON.parse(mdastJson) as MdastNode
      const processedMdast = applyPluginsInJSSync(mdast, {
        remarkPlugins: options.remarkPlugins || [],
        rehypePlugins: options.rehypePlugins || []
      })
      const pluginMs = performance.now() - pluginStart
      
      // Step 3: Codegen
      const codegenStart = performance.now()
      const { code, map } = rustCodegenFromMdastSync(JSON.stringify(processedMdast), {
        filename: options.filename,
        jsxRuntime: options.jsxRuntime,
        jsxImportSource: options.jsxImportSource,
        development: options.development,
        sourceMap: options.sourceMap,
        embedSourcesContent: true
      })
      const codegenMs = performance.now() - codegenStart
      
      const totalMs = performance.now() - startTime
      
      return {
        code,
        map: options.sourceMap ? map : undefined,
        timing: {
          parseMs,
          pluginMs,
          codegenMs,
          totalMs
        },
        engine: 'rust',
        postTransformStage: 'js',
        warnings: warnings.length > 0 ? warnings : undefined
      }
    } else {
      const startTime = performance.now()
      
      const result = jsMdxCompileSync(options.value, {
        filepath: options.filename,
        development: options.development,
        jsxRuntime: options.jsxRuntime,
        jsxImportSource: options.jsxImportSource,
        remarkPlugins: options.remarkPlugins,
        rehypePlugins: options.rehypePlugins,
        format: 'mdx',
        outputFormat: 'function-body',
        providerImportSource: undefined,
        allowDangerousHtml: options.allowDangerousHtml,
        allowDangerousProtocol: options.allowDangerousProtocol,
        remarkRehypeOptions: {
          allowDangerousHtml: options.allowDangerousHtml
        }
      })
      
      const totalMs = performance.now() - startTime
      
      return {
        code: String(result.value),
        map: result.map,
        data: result.data,
        timing: {
          totalMs
        },
        engine: 'js',
        postTransformStage: 'jsx',
        warnings: undefined
      }
    }
  }
  
  /**
   * Asynchronous compilation
   */
  async function compile(options: CompileOptions): Promise<CompileResult> {
    // Validate engine availability
    if (options.mode === 'rust') {
      if (!capabilities.rustBridgeAvailable) {
        throw new RustUnavailableError(
          `Rust bridge not available. Capabilities: ${JSON.stringify(capabilities)}`
        )
      }
      return compileWithRustBridge(options)
    } else if (options.mode === 'js') {
      return compileWithJS(options)
    } else {
      throw new Error(`Invalid engine mode: ${options.mode}`)
    }
  }
  
  // Return public API
  return {
    compile,
    compileSync
  }
}

// ============================================================================
// Binding Function Type Declarations (implementations provided elsewhere)
// ============================================================================

/**
 * Parses MDX to MDAST JSON using Rust (async)
 */
declare function rustParseToMdastJSON(
  content: string,
  options: {
    filename: string
    gfm?: boolean
    footnotes?: boolean
    allowDangerousHtml?: boolean
    allowDangerousProtocol?: boolean
  }
): Promise<string>

/**
 * Parses MDX to MDAST JSON using Rust (sync)
 */
declare function rustParseToMdastJSONSync(
  content: string,
  options: {
    filename: string
    gfm?: boolean
    footnotes?: boolean
    allowDangerousHtml?: boolean
    allowDangerousProtocol?: boolean
  }
): string

/**
 * Generates code from MDAST using Rust (async)
 */
declare function rustCodegenFromMdast(
  mdastJson: string,
  options: {
    filename: string
    jsxRuntime?: 'automatic' | 'classic'
    jsxImportSource?: string
    development?: boolean
    sourceMap?: boolean
    embedSourcesContent?: boolean
  }
): Promise<{ code: string; map?: string }>

/**
 * Generates code from MDAST using Rust (sync)
 */
declare function rustCodegenFromMdastSync(
  mdastJson: string,
  options: {
    filename: string
    jsxRuntime?: 'automatic' | 'classic'
    jsxImportSource?: string
    development?: boolean
    sourceMap?: boolean
    embedSourcesContent?: boolean
  }
): { code: string; map?: string }

/**
 * Applies remark/rehype plugins to MDAST in JavaScript (async)
 */
declare function applyPluginsInJS(
  mdast: MdastNode,
  options: {
    remarkPlugins: PluggableList
    rehypePlugins: PluggableList
  }
): Promise<MdastNode>

/**
 * Applies remark/rehype plugins to MDAST in JavaScript (sync)
 */
declare function applyPluginsInJSSync(
  mdast: MdastNode,
  options: {
    remarkPlugins: PluggableList
    rehypePlugins: PluggableList
  }
): MdastNode

/**
 * Compiles MDX using @mdx-js/mdx (async)
 */
declare function jsMdxCompile(
  content: string,
  options: any
): Promise<VFile>

/**
 * Compiles MDX using @mdx-js/mdx (sync)
 */
declare function jsMdxCompileSync(
  content: string,
  options: any
): VFile