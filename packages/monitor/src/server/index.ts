import type { NextFunction, Request, Response } from "express";
import { MonitorMiddlewareOptions } from "./types";
import htmlescape from "htmlescape";

const NodeEvents = {
  LFSD: "loadFirstScreenData",
  OSR: "onShellReady",
  RTC: "renderTopChunk",
  OAR: "onAllReady",
  NI: "nodeInit",
  PE: "pipeEnd",
} as const;

export type NodeEventsKeys = keyof typeof NodeEvents;
export type NodeEventsValues = (typeof NodeEvents)[NodeEventsKeys];

const DATA = Symbol("data");
const isDev = process.env.NODE_ENV !== "production";

export class ServerMonitor {
  [DATA]: Record<NodeEventsValues, number>;

  mark(name: NodeEventsValues) {
    if (this[DATA][name]) {
      if (isDev) {
        throw new Error(`[monitor]: repeat mark name ${name}...`);
      }
    } else {
      this[DATA][name] = Date.now();
    }
  }

  constructor({
    req,
    res,
    showMonitor = false,
  }: MonitorMiddlewareOptions & {
    req: Request;
    res: Response;
  }) {
    this.mark = this.mark.bind(this);
    this[DATA] = {} as Record<NodeEventsValues, number>;
    req.monitor = this;
    this.mark(NodeEvents.NI);

    Object.defineProperty(res.locals, "monitorInfos", {
      enumerable: true,
      get() {
        const infos: Window["__NODE_MONITOR_INFOS__"] = {
          showMonitor,
          reqId: req.reqId,
          serverData: req.monitor[DATA],
        };

        return `window.__NODE_MONITOR_INFOS__ = ${htmlescape(infos)};`;
      },
    });
  }

  static init({ req, res, options }) {
    if (req.monitor) {
      throw new Error("[monitor]: server init repeat...");
    }

    return new ServerMonitor({ req, res, ...options });
  }
}

export function createMonitorMiddleware(options?: MonitorMiddlewareOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    ServerMonitor.init({ req, res, options });
    next();
  };
}