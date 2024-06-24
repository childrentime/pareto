import type { PerformanceMonitor } from './performance-monitor'
import type { MonitorType } from './types'
import { BaseMonitor } from './types'

const sizeToKB = (i: number) => Math.round(i / 1024)

export class ResourceMonitor extends BaseMonitor<Record<string, number>> {
  collectData(collectorMap: Map<MonitorType, BaseMonitor<object>>): void {
    const perfCollector = collectorMap.get('performance') as PerformanceMonitor

    const { fetchStart = 0 } = perfCollector.value ?? {}

    this.fixGlitchesInBatch({ source: this.value ?? {}, start: fetchStart })
  }

  name: MonitorType

  recordSources: Record<string, number>

  constructor() {
    super()
    this.name = 'resource'
    this.recordSources = {}
  }

  init(): void {
    this.getJSResourceInfo()
    this.dataSource = {
      ...this.getScriptAndStyleTiming(),
      ...this.getFirstScreenImageTiming(),
    }
  }

  get value() {
    return this.dataSource
  }

  getFirstScreenImageTiming() {
    // 获取所有图片资源的加载时间
    const imageResources = performance.getEntriesByType('resource')

    // 获取首屏的宽度和高度
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight

    // 找出在首屏内的图片元素
    const firstScreenImages = Array.from(
      document.getElementsByTagName('img'),
    ).filter(img => {
      const rect = img.getBoundingClientRect()
      return (
        rect.top >= 0 &&
        rect.top < viewportHeight &&
        rect.left >= 0 &&
        rect.left < viewportWidth
      )
    })

    // 找出在首屏内的图片资源
    const firstScreenImageResources = imageResources.filter(resource => {
      return firstScreenImages.some(img => img.src === resource.name)
    })

    // 找到开始加载时间最早和结束加载时间最晚的资源
    const earliestFetchStart = Math.min(
      ...firstScreenImageResources.map(resource => resource.fetchStart),
    )
    const latestResponseEnd = Math.max(
      ...firstScreenImageResources.map(resource => resource.responseEnd),
    )

    return {
      imageStart: earliestFetchStart + performance.timeOrigin,
      imageEnd: latestResponseEnd + performance.timeOrigin,
    }
  }

  getScriptAndStyleTiming() {
    const allScript = Array.from(document.querySelectorAll('script'))
      .filter(script => script.src)
      .map(v => v.src)
    const allStyle: string[] = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    ).map(v => v.href)

    const resourceAry = performance.getEntriesByType('resource')
    const style = resourceAry.filter(item => allStyle.includes(item.name))
    const script = resourceAry.filter(item => allScript.includes(item.name))

    const calc = (
      ary: PerformanceResourceTiming[],
      type: 'min' | 'max',
      key: 'fetchStart' | 'responseEnd',
    ) =>
      (ary.length &&
        ary.reduce(
          (pre, current) => Math[type](pre, current[key]),
          ary[0][key],
        )) ||
      0
    const calcMin = (
      ary: PerformanceResourceTiming[],
      key: 'fetchStart' | 'responseEnd',
    ) => calc(ary, 'min', key)
    const calcMax = (
      ary: PerformanceResourceTiming[],
      key: 'fetchStart' | 'responseEnd',
    ) => calc(ary, 'max', key)

    return {
      scriptStart: calcMin(script, 'fetchStart') + performance.timeOrigin,
      scriptEnd: calcMax(script, 'responseEnd') + performance.timeOrigin,
      styleStart: calcMin(style, 'fetchStart') + performance.timeOrigin,
      styleEnd: calcMax(style, 'responseEnd') + performance.timeOrigin,
    }
  }

  getJSResourceInfo() {
    let totalEncodedBodySize = 0
    let totalDecodedBodySize = 0
    let resourceNum = 0
    let totalTransferSize = 0
    let cacheResourceNum = 0
    let transferResourceNum = 0

    const resourceAry = performance.getEntriesByType('resource')
    const allScript = Array.from(document.querySelectorAll('script')).filter(
      script => script.src,
    )

    const scripts = resourceAry.filter(item => {
      if (
        ['script', 'link'].includes(item.initiatorType) &&
        (item.name.endsWith('.js') || item.name.endsWith('.css'))
      ) {
        return allScript.find(scp => scp.src === item.name)
      }
      return false
    })

    for (const script of scripts) {
      const { transferSize, decodedBodySize, encodedBodySize } = script
      resourceNum += 1
      totalEncodedBodySize += encodedBodySize
      totalDecodedBodySize += decodedBodySize
      transferSize > 0 ? (transferResourceNum += 1) : (cacheResourceNum += 1)
      totalTransferSize += transferSize
    }

    this.recordSources = {
      totalEncodedBodySize: sizeToKB(totalEncodedBodySize),
      totalDecodedBodySize: sizeToKB(totalDecodedBodySize),
      resourceNum,
      totalTransferSize: sizeToKB(totalTransferSize),
      cacheResourceNum,
      transferResourceNum,
    }
  }
}
