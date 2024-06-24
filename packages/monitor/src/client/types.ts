export type MonitorType = 'performance' | 'resource' | 'node' | 'custom'

export abstract class BaseMonitor<Data = object> {
  protected dataSource: null | Data

  public recordTimes: {
    key: string
    start: number
    end: number
    originValue: number
    value: number
  }[]

  constructor() {
    this.dataSource = null
    this.recordTimes = []
  }

  public get value(): null | Data {
    return this.dataSource
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  init(): void | Promise<void> {}
  abstract collectData(collectorMap: Map<MonitorType, BaseMonitor>): void
  abstract name: MonitorType

  getBoundValue(_key?: string): number {
    return 10000
  }

  fixGlitches(props: { key: string; start: number; end: number }): void {
    const { key, start, end } = props
    if (!start || !end) {
      return
    }

    let value = 0
    let originValue = 0

    if (end !== -1) {
      const max = this.getBoundValue()
      originValue = end - start
      value = originValue

      if (originValue < 0 || originValue > max) {
        value = Math.max(0, Math.min(originValue, max))
      }
    }

    this.recordTimes.push({
      key,
      start,
      end,
      originValue,
      value,
    })
  }

  fixGlitchesInBatch(props: {
    source: Record<string, number>
    start: number
  }): void {
    const { source, start } = props
    Object.keys(source).forEach(key => {
      this.fixGlitches({ key, start, end: source[key] })
    })
  }
}

export type BaseMonitorConstructor = new (...args: any[]) => BaseMonitor
