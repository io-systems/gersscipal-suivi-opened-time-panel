type SeriesSize = 'sm' | 'md' | 'lg';

export interface SimpleOptions {
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
}

interface SetupValue {
  model: string[];
  week: any[];
}

export interface Setup {
  key: string;
  value: SetupValue;
}

export interface ProductionOptions {
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
}
