export interface NumberTickerProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export interface SimpleRangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  colorClass?: string;
}

export interface WeeklyCalendarProps {
  currentPatients: number;
  weeklyCapacity: number;
  sessionPrice: number;
}

export type AnimatedNumberProps = NumberTickerProps;
export type SliderProps = SimpleRangeProps;
export type InputRangeProps = SimpleRangeProps;