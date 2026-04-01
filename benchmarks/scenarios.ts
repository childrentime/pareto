export interface Scenario {
  name: string
  path: string
  description: string
  pipelining?: number
  connections?: number
}

export interface Framework {
  name: string
  dir: string
  port: number
  buildCmd: string
  startCmd: string
  startEnv: Record<string, string>
  skipScenarios?: string[]
}

export const scenarios: Scenario[] = [
  {
    name: 'Static SSR',
    path: '/',
    description: 'Page with inline data, no async loader — pure SSR throughput',
  },
  {
    name: 'Data Loading',
    path: '/data',
    description:
      'Loader with simulated 10ms DB query — SSR + data fetching overhead',
  },
  {
    name: 'Streaming SSR',
    path: '/stream',
    description:
      'defer() + Suspense with 200ms delayed data — streaming pipeline efficiency',
    pipelining: 1,
    connections: 50,
  },
  {
    name: 'API / JSON',
    path: '/api/data',
    description: 'Pure JSON endpoint — routing + serialization overhead',
  },
]

export const frameworks: Framework[] = [
  {
    name: 'Pareto',
    dir: 'pareto',
    port: 4000,
    buildCmd: 'pnpm build',
    startCmd: 'pnpm start',
    startEnv: { PORT: '4000', NODE_ENV: 'production' },
  },
  {
    name: 'Next.js',
    dir: 'nextjs',
    port: 4001,
    buildCmd: 'pnpm build',
    startCmd: 'npx next start -p 4001',
    startEnv: { NODE_ENV: 'production' },
  },
  {
    name: 'React Router',
    dir: 'remix',
    port: 4002,
    buildCmd: 'pnpm build',
    startCmd: 'pnpm start',
    startEnv: { PORT: '4002', NODE_ENV: 'production' },
  },
  {
    name: 'TanStack Start',
    dir: 'tanstack',
    port: 4003,
    buildCmd: 'pnpm build',
    startCmd: 'pnpm start',
    startEnv: { PORT: '4003', NODE_ENV: 'production' },
    skipScenarios: ['API / JSON'],
  },
]

export interface AutocannonConfig {
  duration: number
  connections: number
  pipelining: number
  warmupDuration: number
}

export const defaultConfig: AutocannonConfig = {
  duration: 30,
  connections: 100,
  pipelining: 10,
  warmupDuration: 3,
}
