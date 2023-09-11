// load all available handlers explicitely for browserify support
import { BMP } from './types/bmp.js'
import { CUR } from './types/cur.js'
import { DDS } from './types/dds.js'
import { GIF } from './types/gif.js'
import { ICNS } from './types/icns.js'
import { ICO } from './types/ico.js'
import { J2C } from './types/j2c.js'
import { JP2 } from './types/jp2.js'
import { JPG } from './types/jpg.js'
import { KTX } from './types/ktx.js'
import { PNG } from './types/png.js'
import { PNM } from './types/pnm.js'
import { PSD } from './types/psd.js'
import { SVG } from './types/svg.js'
import { TIFF } from './types/tiff.js'
import { WEBP } from './types/webp.js'

export const typeHandlers = {
  bmp: BMP,
  cur: CUR,
  dds: DDS,
  gif: GIF,
  icns: ICNS,
  ico: ICO,
  j2c: J2C,
  jp2: JP2,
  jpg: JPG,
  ktx: KTX,
  png: PNG,
  pnm: PNM,
  psd: PSD,
  svg: SVG,
  tiff: TIFF,
  webp: WEBP,
}

export type imageType = keyof typeof typeHandlers
