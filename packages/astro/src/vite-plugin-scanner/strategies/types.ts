export type ScanStrategy = 'boolean' | 'string'

export type ScanStrategyHandler<T> = (params: {
  code: string
  name: string
  endOfLocalName: string
  isHybridOutput?: boolean
}) => T
