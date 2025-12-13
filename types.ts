export interface NumberTickerProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  colorClass?: string;
}

export interface ResultCardProps {
  title: string;
  value: number;
  highlight?: boolean;
  type: 'neutral' | 'success' | 'danger';
  subtext?: string;
}

export interface WeeklyCalendarProps {
  currentPatients: number;
  weeklyCapacity: number;
  sessionPrice: number;
}