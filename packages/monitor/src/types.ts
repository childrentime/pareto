export abstract class Monitor<Data> {
  private dataSource: null | Data;

  private recordTimes: {
    key: string;
    start: number;
    end: number;
  }[];

  constructor() {
    this.dataSource = null;
    this.recordTimes = [];
  }

  public get value(): null | Data {
    return this.dataSource;
  }

  init(): void {}
  collectData(): void {}

  getBoundValue(): number {
    return 10000;
  }

  fixGlitches(props: { key: string; start: number; end: number }): void {
    const { key, start, end } = props;
  }

  fixGlitchesInBatch(props: {
    sources: Record<string, number>,
    start: number
  }): void {}
}
