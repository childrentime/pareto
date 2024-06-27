import type { MonitorType } from './types'
import { BaseMonitor } from './types'

const RECORD_KEYS = [
  'redirectStart',
  'redirectEnd',
  'fetchStart',
  'domainLookupStart',
  'domainLookupEnd',
  'connectStart',
  'secureConnectionStart',
  'connectEnd',
  'requestStart',
  'responseStart',
  'unloadEventStart',
  'unloadEventEnd',
  'responseEnd',
  'domInteractive',
  'domContentLoadedEventStart',
  'domContentLoadedEventEnd',
  'domComplete',
  'loadEventStart',
  'loadEventEnd',
] as const

type RecordKeys = (typeof RECORD_KEYS)[number]

export class PerformanceMonitor extends BaseMonitor<PerformanceNavigationTiming> {
  name: MonitorType

  collectData(_collectorMap: Map<MonitorType, BaseMonitor<object>>): void {
    const { fetchStart = 0 } = this.value ?? {}
    this.fixGlitchesInBatch({ source: this.records, start: fetchStart })
  }

  constructor() {
    super()
    this.name = 'performance'
  }

  get records(): Record<string, number> {
    if (this.dataSource) {
      return RECORD_KEYS.reduce(
        (acc, key) => {
          acc[key] = this.dataSource?.[key] ?? 0
          return acc
        },
        {} as Record<string, number>,
      )
    }

    return {}
  }

  init(): void {
    // @ts-ignore
    const navigationEntry: PerformanceNavigationTiming =
      performance.getEntriesByType('navigation')[0]

    const dataSource = {} as PerformanceNavigationTiming
    for (const key in navigationEntry) {
      if (
        typeof navigationEntry[key as RecordKeys] === 'number' &&
        RECORD_KEYS.includes(key as RecordKeys)
      ) {
        // @ts-ignore
        dataSource[key] = Math.round(
          navigationEntry[key as RecordKeys] + performance.timeOrigin,
        )
      }
    }
    this.dataSource = dataSource
  }

  getBoundValue(key?: string): number {
    if (
      (['loadEventEnd', 'loadEventStart', 'domComplete'] as string[]).includes(
        (key = ''),
      )
    ) {
      return 20000
    }

    return super.getBoundValue(key)
  }
}
