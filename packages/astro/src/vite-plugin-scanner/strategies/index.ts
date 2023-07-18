import { booleanStrategyHandler } from './booleanStrategy'
import { stringStrategyHandler } from './stringStrategy'

export * from './types'

export const STRATEGIES = {
  boolean: booleanStrategyHandler,
  string: stringStrategyHandler,
} as const
