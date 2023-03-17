export interface ISize {
  width: number | undefined
  height: number | undefined
  orientation?: number
  type?: string
}

export interface ISizeCalculationResult extends ISize {
  images?: ISize[]
}

export interface IImage {
  validate: (buffer: Buffer) => boolean
  calculate: (buffer: Buffer, filepath?: string) => ISizeCalculationResult
}
