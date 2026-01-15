
import React from 'react';
import { ShiftType, Language } from '../types';
import { translations } from '../constants/translations';

export const shiftColors: Record<ShiftType, string> = {
  [ShiftType.MORNING]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [ShiftType.AFTERNOON]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  [ShiftType.NIGHT]: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  [ShiftType.OFF]: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-700'
};

interface ShiftLegendProps {
  lang: Language;
}

const ShiftLegend: React.FC<ShiftLegendProps> = ({ lang }) => {
  const t = translations[lang];
  return (
    <div className={`grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-4 p-3 md:p-4 rounded-xl shadow-sm border mb-6 transition-colors dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-100 ${lang === 'ar' ? 'rtl font-arabic' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-blue-500 shrink-0 shadow-sm"></div>
        <span className="text-[10px] md:text-sm font-bold dark:text-gray-300 text-gray-600">{t.morning} <span className="hidden md:inline opacity-70">(7AM - 3PM)</span></span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-orange-500 shrink-0 shadow-sm"></div>
        <span className="text-[10px] md:text-sm font-bold dark:text-gray-300 text-gray-600">{t.afternoon} <span className="hidden md:inline opacity-70">(3PM - 11PM)</span></span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-purple-500 shrink-0 shadow-sm"></div>
        <span className="text-[10px] md:text-sm font-bold dark:text-gray-300 text-gray-600">{t.night} <span className="hidden md:inline opacity-70">(11PM - 7AM)</span></span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-gray-300 dark:bg-gray-600 shrink-0 shadow-sm"></div>
        <span className="text-[10px] md:text-sm font-bold dark:text-gray-500 text-gray-400 uppercase tracking-tighter">{t.off}</span>
      </div>
    </div>
  );
};

export default ShiftLegend;
