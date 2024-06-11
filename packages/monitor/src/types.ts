

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

  init(): void {

  }
  collectData(): void {

  }

  getBoundValue(): number {
    return 10000;
  }

  fixGlitches(): void {
    
  }

  fixGlitchesInBatch(): void {

  }
}
