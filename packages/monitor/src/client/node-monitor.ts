import { PerformanceMonitor } from "./performance-monitor";
import { BaseMonitor, MonitorType } from "./types";

export class NodeMonitor extends BaseMonitor<
  Window["__NODE_MONITOR_INFOS__"]["serverData"]
> {
  collectData(collectorMap: Map<MonitorType, BaseMonitor>): void {
    if (this.value) {
      const perfCollector = collectorMap.get(
        "performance"
      ) as PerformanceMonitor;

      const { requestStart } = perfCollector.value;
      let { nodeInit, ...others } = this.value;

      // fix glitches between server and client
      if (requestStart) {
        const gap = nodeInit - requestStart;

        nodeInit = requestStart;
        others = Object.entries(others).reduce((acc, [key, val]) => {
          acc[key] = val - gap;
          return acc;
        }, {}) as typeof others;
      }

      this.fixGlitchesInBatch({ source: others, start: nodeInit });
    }
  }
  name: MonitorType;

  constructor() {
    super();
    this.name = "node";
  }

  init() {
    const monitorInfos = window["__NODE_MONITOR_INFOS__"];

    if (monitorInfos) {
      this.dataSource = monitorInfos.serverData;
    }
  }
}
