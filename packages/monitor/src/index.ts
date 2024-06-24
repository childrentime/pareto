import { NodeMonitor, PerformanceMonitor, ResourceMonitor } from './client'
import type { BaseMonitorConstructor, MonitorType } from './client/types'
import { BaseMonitor } from './client/types'
import {
  VitalsMonitor,
  logTimeToInteractiveTime,
} from './client/vitals-monitor'
import { buildTimeline, setup, waitReady } from './devPanel'
import type { TimeLines } from './devPanel/types'
import { reportWebVitals } from './vitals'

export * from './script'
export * from './server'

export interface ReportOptions {
  collectResource?: boolean
  collectNode?: boolean
  collectVitals?: boolean
  collectCustom?: boolean
}
export async function report(options: ReportOptions = {}) {
  const {
    collectNode = true,
    collectResource = true,
    collectVitals = true,
    collectCustom = true,
  } = options

  const waitForNodeMonitorInfos = () => {
    if (!collectNode) {
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (window.__NODE_MONITOR_INFOS__) {
          clearInterval(interval)
          resolve(window.__NODE_MONITOR_INFOS__)
        }
      }, 200)

      setTimeout(() => {
        clearInterval(interval)
        reject(new Error('Timed out waiting for __NODE_MONITOR_INFOS__'))
      }, 10000)
    })
  }

  logTimeToInteractiveTime()
  if (collectVitals) {
    reportWebVitals()
  }

  await waitForNodeMonitorInfos()

  if (window.__NODE_MONITOR_INFOS__?.showMonitor || !collectNode) {
    await waitReady()
    const timelines = await new Promise<TimeLines[]>((resolve, reject) => {
      setTimeout(() => {
        try {
          const monitorList = [
            collectCustom && VitalsMonitor,
            PerformanceMonitor,
            collectNode && NodeMonitor,
            collectResource && ResourceMonitor,
          ].filter(Boolean) as BaseMonitorConstructor[]

          applyMonitors(monitorList)
            .then(monitors => {
              const timelines = buildTimeline(monitors)
              setup(timelines)
              resolve(timelines)
            })
            .catch(error => {
              reject(error)
            })
        } catch (error) {
          reject(error)
        }
      }, 0)
    })

    return timelines
  }
}

async function applyMonitors(monitorList: BaseMonitorConstructor[]) {
  const monitorsMap = monitorList.reduce((acc, Monitor) => {
    const monitor = new Monitor()

    if (!(monitor instanceof BaseMonitor)) {
      throw new Error('[monitor]: exist monitor don‘t extends BaseMonitor')
    }

    if (!monitor.name) {
      throw new Error('[monitor]: monitor’s name miss')
    }

    if (acc.get(monitor.name)) {
      throw new Error(`[monitor]: repeat monitor name ${monitor.name}`)
    }

    acc.set(monitor.name, monitor)

    return acc
  }, new Map<MonitorType, BaseMonitor>())

  const monitors = [...monitorsMap.values()]

  return Promise.all(monitors.map(monitor => monitor.init())).then(() => {
    monitors.forEach(monitor => {
      monitor.collectData(monitorsMap)
    })

    return monitors
  })
}
