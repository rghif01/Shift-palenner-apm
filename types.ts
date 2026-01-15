
export enum ShiftType {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  NIGHT = 'Night',
  OFF = 'OFF'
}

export type ShiftGroup = 'A' | 'B' | 'C' | 'D';
export type Language = 'en' | 'ar';

export interface ShiftAssignment {
  [key: string]: ShiftType; // e.g., "A": ShiftType.MORNING
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  nameEn: string;
  nameAr: string;
  type: 'Religious' | 'National' | 'School';
}

export interface DayData {
  date: Date;
  day: number;
  holiday?: Holiday;
  shifts: ShiftAssignment;
  isToday?: boolean;
}

export interface ExportSettings {
  startDate: string;
  endDate: string;
  includeLegend: boolean;
  selectedShift: ShiftGroup | 'ALL';
  layout: 'grid' | 'list';
  orientation: 'portrait' | 'landscape';
  language: Language;
  includeHolidays: boolean;
  includeReligious: boolean;
  includeNational: boolean;
  includeSchool: boolean;
  paperSize: 'a4' | 'letter';
  isFullYear?: boolean;
}
