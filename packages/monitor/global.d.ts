import type { VitalsType } from './src/client/vitals-monitor'
import type { NodeEventsValues, ServerMonitor } from './src/server'

declare global {
  interface Window {
    __NODE_MONITOR_INFOS__: {
      serverData: Record<NodeEventsValues, number>
      reqId: string
      showMonitor: boolean
    }
    __TIME_METRICS__: [VitalsType, number][]
    __WEB_VITALS__: [string, number][]
    __tti: any
  }

  namespace Express {
    interface Request {
      monitor: ServerMonitor
      reqId: string
    }
  }
}

export {}
