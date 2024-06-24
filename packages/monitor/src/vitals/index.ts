import ttiPolyfill from 'tti-polyfill'
import type { Metric } from 'web-vitals'
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

export function reportWebVitals() {
  const addToQueue = (metric: Metric) => {
    if (!window.__WEB_VITALS__) {
      window.__WEB_VITALS__ = []
    }
    window.__WEB_VITALS__.push([metric.name, metric.value])
  }

  onCLS(addToQueue)
  onFCP(addToQueue)
  onLCP(addToQueue)
  onTTFB(addToQueue)
  onINP(addToQueue)

  ttiPolyfill
    .getFirstConsistentlyInteractive({})
    .then(ttid => {
      if (!window.__WEB_VITALS__) {
        window.__WEB_VITALS__ = []
      }

      // @ts-ignore
      window.__WEB_VITALS__.push(['TTI', ttid])
    })
    .catch(console.log)
}
