import { BaseMonitor, MonitorType } from "./types";

const RECORD_KEYS = [
  "navigationStart",
  "redirectStart",
  "redirectEnd",
  "fetchStart",
  "domainLookupStart",
  "domainLookupEnd",
  "connectStart",
  "secureConnectionStart",
  "connectEnd",
  "requestStart",
  "responseStart",
  "unloadEventStart",
  "unloadEventEnd",
  "responseEnd",
  "domLoading",
  "domInteractive",
  "domContentLoadedEventStart",
  "domContentLoadedEventEnd",
  "domComplete",
  "loadEventStart",
  "loadEventEnd",
];

export class PerformanceMonitor extends BaseMonitor<PerformanceNavigationTiming> {
  name: MonitorType;

  collectData(collectorMap: Map<MonitorType, BaseMonitor<{}>>): void {
    const { fetchStart } = this.value;
    this.fixGlitchesInBatch({ source: this.records, start: fetchStart });
  }

  constructor() {
    super();
    this.name = "performance";
  }

  get records(): Record<string, number>{
    if (this.dataSource) {
      return RECORD_KEYS.reduce((acc, key) => {
        acc[key] = this.dataSource[key];
        return acc;
      }, {});
    }

    return {};
  }

  init(): void {
    this.dataSource = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
  }

  getBoundValue(key?: string): number {
    if (["loadEventEnd", "loadEventStart", "domComplete"].includes(key)) {
      return 20000;
    }

    return super.getBoundValue(key);
  }
}
