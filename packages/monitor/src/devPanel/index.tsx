import { createRoot } from 'react-dom/client'
import type { BaseMonitor } from '../client/types'
import TimeLine from './TimeLine'
import type { TimeLines } from './types'

export function setup(timelines: TimeLines[]) {
  const container = document.createElement('div')

  container.id = `monitor-panel`
  document.body.appendChild(container)

  createRoot(container).render(<TimeLine source={timelines} />)
}

export function buildTimeline(monitors: BaseMonitor[]): TimeLines[] {
  const timelines = monitors.reduce((acc, monitor) => {
    const spans = monitor.recordTimes
      .sort((a, b) => a.start - b.start)
      .map(rt => ({
        name: rt.key,
        start: Math.round(rt.start),
        end: Math.round(rt.start + rt.value),
      }))

    if (spans.length) {
      acc.push({
        title: monitor.name,
        spans,
      })
    }

    return acc
  }, [] as TimeLines[])

  return timelines
}

export const waitReady = () => {
  return new Promise<void>(resolve => {
    if (document.readyState === 'complete') {
      resolve()
    } else {
      window.addEventListener('load', () => {
        resolve()
      })
    }
  })
}
