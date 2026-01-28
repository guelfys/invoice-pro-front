export const MULTI_ENV_ENABLED =
  (import.meta.env.VITE_MULTI_ENV_ENABLED ?? 'false') === 'true'

export const DEFAULT_ENV = (import.meta.env.VITE_DEFAULT_ENV ?? 'prod') as 'demo' | 'prod'
