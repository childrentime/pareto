import { MonitorType } from "../client/types";

export interface TimeLines {
  title: MonitorType;
  spans: [
    {
      name: string;
      start: number;
      end: number;
    }
  ];
}
