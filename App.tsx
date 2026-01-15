
import React, { useState, useMemo, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { 
  Calendar as CalendarIcon, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Ship,
  ShieldCheck,
  X,
  Printer,
  LayoutGrid,
  List as ListIcon,
  Clock,
  ToggleLeft,
  ToggleRight,
  FileText,
  Info,
  Moon,
  Sun,
  Flag,
  GraduationCap,
  Square,
  CheckSquare,
  Globe,
  FileSpreadsheet,
  Table,
  ChevronDown,
  FileCode,
  FileJson,
  Sparkles,
  CalendarDays,
  CheckCircle2
} from 'lucide-react';
import { ShiftGroup, ShiftType, ExportSettings, Language, Holiday } from './types';
import { MOROCCAN_HOLIDAYS_2026 } from './constants/holidays';
import { getShiftsForDate } from './utils/shiftLogic';
import ShiftLegend, { shiftColors } from './components/ShiftLegend';
import { translations } from './constants/translations';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [selectedShift, setSelectedShift] = useState<ShiftGroup | 'ALL'>('ALL');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredHoliday, setHoveredHoliday] = useState<{ holiday: Holiday, x: number, y: number } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    includeLegend: true,
    selectedShift: 'ALL',
    layout: 'grid',
    orientation: 'landscape',
    language: 'en',
    includeHolidays: true,
    includeReligious: true,
    includeNational: true,
    includeSchool: true,
    paperSize: 'a4',
    isFullYear: false
  });

  const calendarRef = useRef<HTMLDivElement>(null);
  const exportPreviewRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);
  const t = translations[lang];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    setExportSettings(prev => ({ ...prev, language: lang, selectedShift: selectedShift }));
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, selectedShift]);

  const getHolidayIcon = (type: string, size = 12) => {
    switch (type) {
      case 'Religious': return <Moon size={size} className="text-amber-500 fill-amber-500" />;
      case 'National': return <Flag size={size} className="text-red-600 fill-red-600" />;
      case 'School': return <GraduationCap size={size} className="text-blue-600 fill-blue-600" />;
      default: return null;
    }
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const holiday = MOROCCAN_HOLIDAYS_2026.find(h => h.date === dateStr);
      const shifts = getShiftsForDate(date);
      const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      days.push({ date, day: d, holiday, shifts, isToday });
    }
    return days;
  }, [currentDate, today]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };

  const generateDataRows = (start: string, end: string, specificShift: ShiftGroup | 'ALL', includeHolidays: boolean) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const data = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const shifts = getShiftsForDate(current);
      const holiday = MOROCCAN_HOLIDAYS_2026.find(h => h.date === dateStr);
      
      const row: any = {
        [t.csvHeaders.date]: dateStr,
        [t.csvHeaders.day]: t.days[current.getDay()],
      };

      const groups: ShiftGroup[] = specificShift === 'ALL' ? ['A', 'B', 'C', 'D'] : [specificShift];
      groups.forEach(g => {
        row[`Shift ${g}`] = getTranslatedShiftFull(shifts[g], lang);
      });

      if (includeHolidays) {
        row[t.csvHeaders.holiday] = holiday ? (lang === 'ar' ? holiday.nameAr : holiday.nameEn) : '';
      }

      data.push(row);
      current.setDate(current.getDate() + 1);
    }
    return data;
  };

  const handleExportXLSX = () => {
    const start = exportSettings.isFullYear ? '2026-01-01' : exportSettings.startDate;
    const end = exportSettings.isFullYear ? '2026-12-31' : exportSettings.endDate;
    const data = generateDataRows(start, end, exportSettings.selectedShift, exportSettings.includeHolidays);
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ShiftPlan");
    XLSX.writeFile(wb, `APMT_Export_${start}_to_${end}.xlsx`);
    setIsExportModalOpen(false);
  };

  const handleExportExcelStyled = () => {
    const start = new Date(exportSettings.isFullYear ? '2026-01-01' : exportSettings.startDate);
    const end = new Date(exportSettings.isFullYear ? '2026-12-31' : exportSettings.endDate);
    const shift = exportSettings.selectedShift;

    const getStyle = (type: ShiftType | 'HEADER' | 'HOLIDAY' | 'DATE' | 'NORMAL' | 'BRAND' | 'WEEKEND') => {
      const base = 'padding: 12px; border: 1px solid #E2E8F0; vertical-align: middle; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt;';
      switch(type) {
        case 'BRAND': return `${base} background-color: #FF6A13; color: #ffffff; font-weight: bold; text-align: center; font-size: 16pt; height: 50px; border: none;`;
        case 'HEADER': return `${base} background-color: #003D4F; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #002d3a;`;
        case ShiftType.MORNING: return `${base} background-color: #E0F2FE; color: #0369A1; text-align: center; font-weight: bold;`;
        case ShiftType.AFTERNOON: return `${base} background-color: #FEF3C7; color: #B45309; text-align: center; font-weight: bold;`;
        case ShiftType.NIGHT: return `${base} background-color: #F3E8FF; color: #7E22CE; text-align: center; font-weight: bold;`;
        case ShiftType.OFF: return `${base} background-color: #F8FAFC; color: #94A3B8; text-align: center; font-style: italic;`;
        case 'HOLIDAY': return `${base} background-color: #FEE2E2; color: #DC2626; font-weight: 900; text-align: center; border: 2px solid #FCA5A5;`;
        case 'DATE': return `${base} background-color: #F1F5F9; font-weight: bold; text-align: center; color: #475569;`;
        case 'WEEKEND': return `${base} background-color: #F8FAFC; text-align: center; color: #1E293B; font-weight: 500;`;
        default: return `${base} text-align: center; background-color: #FFFFFF; color: #1E293B;`;
      }
    };

    const columnsCount = (shift === 'ALL' ? 4 : 1) + 2 + (exportSettings.includeHolidays ? 1 : 0);

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table>
          <thead>
            <tr>
              <th colspan="${columnsCount}" style="${getStyle('BRAND')}">APM TERMINALS TANGIER - SHIFT PLANNER 2026</th>
            </tr>
            <tr>
              <th style="${getStyle('HEADER')}">${t.csvHeaders.date}</th>
              <th style="${getStyle('HEADER')}">${t.csvHeaders.day}</th>
              ${shift === 'ALL' || shift === 'A' ? `<th style="${getStyle('HEADER')}">${t.csvHeaders.shiftA}</th>` : ''}
              ${shift === 'ALL' || shift === 'B' ? `<th style="${getStyle('HEADER')}">${t.csvHeaders.shiftB}</th>` : ''}
              ${shift === 'ALL' || shift === 'C' ? `<th style="${getStyle('HEADER')}">${t.csvHeaders.shiftC}</th>` : ''}
              ${shift === 'ALL' || shift === 'D' ? `<th style="${getStyle('HEADER')}">${t.csvHeaders.shiftD}</th>` : ''}
              ${exportSettings.includeHolidays ? `<th style="${getStyle('HEADER')}">${t.csvHeaders.holiday}</th>` : ''}
            </tr>
          </thead>
          <tbody>
    `;

    let current = new Date(start);
    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const shifts = getShiftsForDate(current);
      const holiday = MOROCCAN_HOLIDAYS_2026.find(h => h.date === dateStr);
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      
      html += `
        <tr>
          <td style="${getStyle('DATE')}">${dateStr}</td>
          <td style="${getStyle(isWeekend ? 'WEEKEND' : 'NORMAL')}">${t.days[current.getDay()]}</td>
          ${shift === 'ALL' || shift === 'A' ? `<td style="${getStyle(shifts['A'])}">${getTranslatedShiftFull(shifts['A'], lang)}</td>` : ''}
          ${shift === 'ALL' || shift === 'B' ? `<td style="${getStyle(shifts['B'])}">${getTranslatedShiftFull(shifts['B'], lang)}</td>` : ''}
          ${shift === 'ALL' || shift === 'C' ? `<td style="${getStyle(shifts['C'])}">${getTranslatedShiftFull(shifts['C'], lang)}</td>` : ''}
          ${shift === 'ALL' || shift === 'D' ? `<td style="${getStyle(shifts['D'])}">${getTranslatedShiftFull(shifts['D'], lang)}</td>` : ''}
          ${exportSettings.includeHolidays ? `<td style="${holiday ? getStyle('HOLIDAY') : getStyle(isWeekend ? 'WEEKEND' : 'NORMAL')}">${holiday ? (lang === 'ar' ? holiday.nameAr : holiday.nameEn) : ''}</td>` : ''}
        </tr>
      `;
      current.setDate(current.getDate() + 1);
    }

    html += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="${columnsCount}" style="padding-top: 20px; font-size: 9pt; color: #94A3B8; text-align: center;">
                Generated by APMT Shift Planner System © 2026 - All Rights Reserved
              </td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `APMT_Premium_Plan_${exportSettings.isFullYear ? 'FullYear' : 'Range'}.xls`;
    link.click();
    setIsExportModalOpen(false);
  };

  const handleExportPDF = async () => {
    if (!exportPreviewRef.current) return;
    setIsExporting(true);
    
    try {
      const exportContainer = document.getElementById('pdf-export-content');
      if (exportContainer) exportContainer.style.display = 'block';
      await new Promise(r => setTimeout(r, 2000));
      const canvas = await html2canvas(exportPreviewRef.current, { 
        scale: 1.5, 
        useCORS: true, 
        backgroundColor: isDarkMode ? '#111827' : '#ffffff',
        logging: false,
        windowWidth: exportPreviewRef.current.scrollWidth,
        windowHeight: exportPreviewRef.current.scrollHeight
      });
      if (exportContainer) exportContainer.style.display = 'none';
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF({ 
        orientation: exportSettings.orientation === 'landscape' ? 'l' : 'p', 
        unit: 'mm', 
        format: exportSettings.paperSize 
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`APMT_Shift_Report_2026.pdf`);
      setIsExportModalOpen(false);
    } catch (e) { 
      console.error('PDF Export Error:', e);
      alert('Failed to generate PDF.');
    } finally { 
      setIsExporting(false); 
    }
  };

  const getTranslatedShiftFull = (type: ShiftType, language: Language) => translations[language][type.toLowerCase() as keyof typeof translations['en']];

  const previewData = useMemo(() => {
    const start = new Date(exportSettings.isFullYear ? '2026-01-01' : exportSettings.startDate);
    const end = new Date(exportSettings.isFullYear ? '2026-12-31' : exportSettings.endDate);
    const monthsData: { month: string, year: number, days: any[] }[] = [];
    let current = new Date(start);
    const monthNames = translations[exportSettings.language].months;
    while (current <= end) {
      const monthIdx = current.getMonth();
      const year = current.getFullYear();
      const monthName = monthNames[monthIdx];
      let monthEntry = monthsData.find(m => m.month === monthName && m.year === year);
      if (!monthEntry) {
        monthEntry = { month: monthName, year, days: [] };
        monthsData.push(monthEntry);
      }
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const holiday = MOROCCAN_HOLIDAYS_2026.find(h => h.date === dateStr);
      let filteredHoliday = undefined;
      if (exportSettings.includeHolidays && holiday) {
        if (holiday.type === 'Religious' && exportSettings.includeReligious) filteredHoliday = holiday;
        else if (holiday.type === 'National' && exportSettings.includeNational) filteredHoliday = holiday;
        else if (holiday.type === 'School' && exportSettings.includeSchool) filteredHoliday = holiday;
      }
      monthEntry.days.push({ date: new Date(current), day: current.getDate(), holiday: filteredHoliday, shifts: getShiftsForDate(current) });
      current.setDate(current.getDate() + 1);
      if (monthsData.reduce((sum, m) => sum + m.days.length, 0) > 400) break;
    }
    return monthsData;
  }, [exportSettings]);

  const handleHolidayHover = (e: React.MouseEvent, holiday: Holiday) => {
    setHoveredHoliday({
      holiday,
      x: e.clientX,
      y: e.clientY
    });
  };

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} overflow-x-hidden ${lang === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      <header className="bg-[#FF6A13] text-white py-4 md:py-6 shadow-lg mb-4 md:mb-8 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 md:p-2 rounded-xl shadow-sm"><Ship className="text-[#003D4F] w-6 h-6 md:w-8 md:h-8" /></div>
              <h1 className="text-xl md:text-2xl font-black">{t.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all active:scale-95 flex items-center justify-center"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} className="text-amber-300" /> : <Moon size={20} />}
              </button>
              <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="md:hidden flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold">
                <Globe size={14} />{lang === 'en' ? 'العربية' : 'English'}
              </button>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-[#003D4F]/20 p-1 rounded-xl">
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang === 'en' ? 'bg-white text-[#FF6A13] shadow-sm' : 'text-white/70 hover:text-white'}`}>English</button>
            <button onClick={() => setLang('ar')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang === 'ar' ? 'bg-white text-[#FF6A13] shadow-sm' : 'text-white/70 hover:text-white'}`}>العربية</button>
          </div>
          <div className="flex w-full md:w-auto gap-1 bg-[#003D4F]/20 p-1 rounded-xl">
            {(['A', 'B', 'C', 'D'] as ShiftGroup[]).map(s => (
              <button key={s} onClick={() => setSelectedShift(s)} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${selectedShift === s ? 'bg-white text-[#FF6A13]' : 'text-white hover:bg-white/10'}`}>{s}</button>
            ))}
            <button onClick={() => setSelectedShift('ALL')} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${selectedShift === 'ALL' ? 'bg-white text-[#FF6A13]' : 'text-white hover:bg-white/10'}`}>{t.all}</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className={`flex items-center justify-between w-full md:w-auto p-1.5 rounded-xl shadow-sm border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <button onClick={() => changeMonth(-1)} className={`p-3 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-[#003D4F]'}`}>{lang === 'en' ? <ChevronLeft /> : <ChevronRight />}</button>
            <span className={`text-xl font-black px-8 text-center min-w-[200px] ${isDarkMode ? 'text-white' : 'text-[#003D4F]'}`}>{t.months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button onClick={() => changeMonth(1)} className={`p-3 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-[#003D4F]'}`}>{lang === 'en' ? <ChevronRight /> : <ChevronLeft />}</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button onClick={() => setIsExportModalOpen(true)} className="flex items-center justify-center gap-3 bg-[#003D4F] text-white px-8 py-4 rounded-xl font-black shadow-lg hover:bg-[#002d3a] transition-all group active:scale-95">
              <Download size={20} className="group-hover:translate-y-1 transition-transform" />
              <span>{lang === 'ar' ? 'تصدير التقارير' : 'Export Reports'}</span>
            </button>
          </div>
        </div>

        <ShiftLegend lang={lang} />

        <div ref={calendarRef} className={`rounded-3xl shadow-xl border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-2 md:p-8`}>
          <div className={`grid grid-cols-7 gap-px overflow-hidden rounded-2xl border ${isDarkMode ? 'bg-gray-700 border-gray-700' : 'bg-gray-200 border-gray-200'}`}>
            {t.daysInitial.map((day, i) => (
              <div key={i} className={`py-3 text-center text-[10px] md:text-xs font-black transition-colors ${isDarkMode ? 'bg-gray-900 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
                {t.days[i]}
              </div>
            ))}
            {daysInMonth.map((dayData, idx) => (
              <div 
                key={idx} 
                className={`min-h-[80px] md:min-h-[140px] p-1 md:p-3 transition-all relative group 
                  ${!dayData ? (isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50/50') : (isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50')}
                  ${dayData?.isToday ? 'ring-2 ring-inset ring-[#FF6A13] z-10' : ''}
                  ${dayData?.holiday ? (isDarkMode ? 'bg-red-900/10' : 'bg-red-50/10') : ''}
                `}
              >
                {dayData && (
                  <>
                    <div className="flex justify-between items-start mb-1 md:mb-3">
                      <span className={`text-xs md:text-lg font-black h-6 md:h-9 w-6 md:w-9 flex items-center justify-center rounded-lg transition-colors
                        ${dayData.holiday ? 'bg-red-500 text-white shadow-sm' : 
                          dayData.isToday ? 'bg-[#FF6A13] text-white shadow-sm' : 
                          isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-[#003D4F] bg-gray-100'}`}
                      >
                        {dayData.day}
                      </span>
                      {dayData.holiday && (
                        <div 
                          className={`flex items-center gap-1 opacity-80 cursor-help p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          onMouseEnter={(e) => handleHolidayHover(e, dayData.holiday!)}
                          onMouseLeave={() => setHoveredHoliday(null)}
                        >
                          {getHolidayIcon(dayData.holiday.type, 14)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {(['A', 'B', 'C', 'D'] as ShiftGroup[]).map(group => {
                        if (selectedShift !== 'ALL' && selectedShift !== group) return null;
                        const shift = dayData.shifts[group];
                        return (
                          <div key={group} className={`flex justify-between items-center px-1.5 md:px-2.5 py-1 rounded-md text-[9px] md:text-sm font-black border-2 transition-colors ${shiftColors[shift]} ${isDarkMode && shift === ShiftType.OFF ? 'bg-gray-700 text-gray-400 border-gray-600' : ''}`}>
                            <span className="opacity-80">{group}</span><span>{shift === ShiftType.MORNING ? t.mShort : shift === ShiftType.AFTERNOON ? t.aShort : shift === ShiftType.NIGHT ? t.nShort : t.oShort}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Holiday Tooltip */}
      {hoveredHoliday && (
        <div 
          className="fixed z-[200] pointer-events-none animate-in fade-in zoom-in duration-200"
          style={{ top: hoveredHoliday.y - 120, left: hoveredHoliday.x - 100 }}
        >
          <div className={`border-2 p-4 rounded-2xl shadow-2xl min-w-[220px] flex flex-col gap-2 transition-colors ${isDarkMode ? 'bg-gray-800 border-[#FF6A13] text-white shadow-orange-500/10' : 'bg-white border-[#FF6A13] text-[#003D4F]'}`}>
            <div className={`flex items-center justify-between gap-4 border-b pb-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-widest flex items-center gap-1 ${isDarkMode ? 'bg-orange-950 text-[#FF6A13]' : 'bg-orange-50 text-[#FF6A13]'}`}>
                {getHolidayIcon(hoveredHoliday.holiday.type, 10)}
                {t.holidayTypes[hoveredHoliday.holiday.type as keyof typeof t.holidayTypes]}
              </span>
              <Info size={14} className="text-gray-400" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-black text-right font-arabic leading-tight">{hoveredHoliday.holiday.nameAr}</div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">{hoveredHoliday.holiday.nameEn}</div>
            </div>
            <div className={`text-[10px] font-black pt-1 border-t ${isDarkMode ? 'border-gray-700 text-[#FF6A13]' : 'border-gray-50 text-[#FF6A13]'}`}>{hoveredHoliday.holiday.date}</div>
          </div>
        </div>
      )}

      {/* Unified Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#003D4F]/90 backdrop-blur-sm animate-in fade-in">
          <div className={`rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] transition-colors ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-center shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`text-xl font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#003D4F]'}`}>
                <Download size={24} className="text-[#FF6A13]" />
                {t.exportSettings}
              </h3>
              <button onClick={() => setIsExportModalOpen(false)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={20} /></button>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className={`flex items-center justify-between p-5 rounded-2xl border-2 shadow-sm transition-colors ${isDarkMode ? 'bg-orange-950/30 border-orange-900/50' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-700 text-[#FF6A13]' : 'bg-white text-[#FF6A13]'}`}>
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <span className={`block text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#003D4F]'}`}>{lang === 'ar' ? 'العام كامل (2026)' : 'Full Year 2026'}</span>
                    <span className="text-[10px] font-bold text-[#FF6A13] uppercase tracking-widest">{lang === 'ar' ? 'تصدير السنة كاملة' : 'Export the entire year'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setExportSettings(prev => ({...prev, isFullYear: !prev.isFullYear}))}
                  className={`p-1 rounded-full transition-all duration-300 ${exportSettings.isFullYear ? 'bg-[#FF6A13]' : 'bg-gray-300'}`}
                >
                  {exportSettings.isFullYear ? <ToggleRight className="text-white" size={36} /> : <ToggleLeft className="text-white" size={36} />}
                </button>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${exportSettings.isFullYear ? 'opacity-30 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.startDate}</label>
                  <input type="date" value={exportSettings.startDate} onChange={(e) => setExportSettings(prev => ({...prev, startDate: e.target.value}))} className={`w-full p-3 rounded-xl border-2 font-bold outline-none transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-[#FF6A13]' : 'bg-white border-gray-100 focus:border-[#FF6A13]'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.endDate}</label>
                  <input type="date" value={exportSettings.endDate} onChange={(e) => setExportSettings(prev => ({...prev, endDate: e.target.value}))} className={`w-full p-3 rounded-xl border-2 font-bold outline-none transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white focus:border-[#FF6A13]' : 'bg-white border-gray-100 focus:border-[#FF6A13]'}`} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.selectShift}</label>
                <div className={`flex gap-2 p-1.5 rounded-2xl border-2 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  {(['A', 'B', 'C', 'D', 'ALL'] as (ShiftGroup | 'ALL')[]).map(s => (
                    <button key={s} onClick={() => setExportSettings(prev => ({...prev, selectedShift: s}))} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${exportSettings.selectedShift === s ? (isDarkMode ? 'bg-gray-700 text-[#FF6A13] shadow-md border border-gray-600' : 'bg-white text-[#FF6A13] shadow-md border border-gray-100') : 'text-gray-400 hover:text-[#003D4F] dark:hover:text-gray-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-4">
                  <CalendarIcon className="text-[#FF6A13]" size={24} />
                  <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#003D4F]'}`}>{t.includeHolidays}</span>
                </div>
                <button 
                  onClick={() => setExportSettings(prev => ({...prev, includeHolidays: !prev.includeHolidays}))}
                  className={`p-1 rounded-full transition-all ${exportSettings.includeHolidays ? 'bg-[#FF6A13]' : 'bg-gray-300'}`}
                >
                  {exportSettings.includeHolidays ? <ToggleRight className="text-white" size={32} /> : <ToggleLeft className="text-white" size={32} />}
                </button>
              </div>
            </div>

            <div className={`p-6 border-t space-y-4 transition-colors ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  onClick={handleExportPDF} 
                  disabled={isExporting} 
                  className="bg-[#FF6A13] text-white py-4 px-6 rounded-2xl font-black shadow-lg flex flex-col items-center justify-center gap-1 hover:bg-[#ff7b2b] transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    {isExporting ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Printer size={18} />}
                    <span className="text-[11px] uppercase tracking-wider">PDF Report</span>
                  </div>
                </button>
                
                <button 
                  onClick={handleExportExcelStyled} 
                  className="bg-emerald-600 text-white py-4 px-6 rounded-2xl font-black shadow-lg flex flex-col items-center justify-center gap-1 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <Table size={18} />
                    <span className="text-[11px] uppercase tracking-wider">Excel Color</span>
                  </div>
                </button>

                <button 
                  onClick={handleExportXLSX} 
                  className="bg-gray-800 text-white py-4 px-6 rounded-2xl font-black shadow-lg flex flex-col items-center justify-center gap-1 hover:bg-gray-900 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <FileJson size={18} />
                    <span className="text-[11px] uppercase tracking-wider">Standard XLSX</span>
                  </div>
                </button>
              </div>
              
              <button onClick={() => setIsExportModalOpen(false)} className="w-full py-2 font-black text-gray-400 uppercase tracking-widest text-[10px] hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF content Wrapper */}
      <div id="pdf-export-content" style={{ position: 'fixed', left: '-10000px', top: 0, width: 'fit-content', pointerEvents: 'none', display: 'none' }}>
        <div ref={exportPreviewRef} className={`${exportSettings.orientation === 'landscape' ? 'w-[1200px]' : 'w-[850px]'} ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-[#003D4F]'} p-16 ${exportSettings.language === 'ar' ? 'rtl font-arabic' : 'font-sans'}`}>
           <div className={`flex justify-between items-start mb-10 pb-10 border-b-8 border-[#FF6A13] ${exportSettings.language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className={exportSettings.language === 'ar' ? 'text-right' : 'text-left'}>
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{translations[exportSettings.language].title}</h1>
                <div className="bg-[#003D4F] text-white px-6 py-2 rounded-xl inline-block text-xl font-bold uppercase tracking-widest">{translations[exportSettings.language].plannerTitle}</div>
                <p className="text-2xl text-gray-400 font-bold mt-4 uppercase">
                  {exportSettings.isFullYear ? '2026 FULL YEAR' : `${exportSettings.startDate} — ${exportSettings.endDate}`}
                </p>
              </div>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/APM_Terminals_logo.svg/2560px-APM_Terminals_logo.svg.png" className="h-20" alt="Logo" />
           </div>

           <div className="space-y-12">
              {previewData.map((monthData, mIdx) => (
                <div key={mIdx} className="break-inside-avoid mb-20">
                  <h3 className={`text-4xl font-black text-[#FF6A13] mb-8 uppercase border-b-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} inline-block`}>{monthData.month} {monthData.year}</h3>
                  
                  {exportSettings.layout === 'grid' ? (
                    <div className={`border-[4px] ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} rounded-3xl overflow-hidden shadow-sm`}>
                       <div className={`grid grid-cols-7 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b-2 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                          {translations[exportSettings.language].daysShort.map((d: string) => (
                            <div key={d} className="py-5 text-center text-sm font-black text-gray-500 tracking-widest uppercase">{d}</div>
                          ))}
                       </div>
                       <div className={`grid grid-cols-7 ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
                          {Array.from({ length: monthData.days[0].date.getDay() }).map((_, i) => (
                            <div key={`p-${i}`} className={`${isDarkMode ? 'bg-gray-950/30 border-gray-800' : 'bg-gray-50/10 border-gray-100'} border-b-2 border-r-2 min-h-[160px]`} />
                          ))}
                          {monthData.days.map((d, i) => (
                            <div key={i} className={`p-5 border-b-2 border-r-2 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} last:border-r-0 min-h-[160px] ${d.holiday ? (isDarkMode ? 'bg-red-900/5' : 'bg-red-50/10') : ''}`}>
                               <div className="flex justify-between items-start mb-5">
                                 <span className={`text-3xl font-black h-12 w-12 flex items-center justify-center rounded-2xl ${d.holiday ? 'bg-red-500 text-white shadow-lg' : isDarkMode ? 'text-gray-300 border-2 border-gray-800 bg-gray-800' : 'text-[#003D4F] border-2 border-gray-100 bg-white'}`}>{d.day}</span>
                                 {d.holiday && <div className="p-1">{getHolidayIcon(d.holiday.type, 20)}</div>}
                               </div>
                               <div className="space-y-2">
                                  {(['A', 'B', 'C', 'D'] as ShiftGroup[]).map(g => {
                                    const shift = d.shifts[g];
                                    if (exportSettings.selectedShift !== 'ALL' && exportSettings.selectedShift !== g) return null;
                                    const trans = translations[exportSettings.language];
                                    return (
                                      <div key={g} className={`flex justify-between items-center px-4 py-2 rounded-xl text-[13px] font-black border-2 ${shiftColors[shift]} shadow-sm ${isDarkMode && shift === ShiftType.OFF ? 'border-gray-800 bg-gray-800 text-gray-500' : ''}`}>
                                        <span className="opacity-70">{translations[exportSettings.language].shift} {g}</span>
                                        <span className="uppercase">{shift === ShiftType.MORNING ? trans.mShort : shift === ShiftType.AFTERNOON ? trans.aShort : shift === ShiftType.NIGHT ? trans.nShort : trans.oShort}</span>
                                      </div>
                                    );
                                  })}
                               </div>
                               {d.holiday && (
                                <div className={`mt-4 text-[11px] font-black text-red-600 flex items-center gap-1 leading-tight ${exportSettings.language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
                                  <span className="shrink-0">{getHolidayIcon(d.holiday.type, 10)}</span>
                                  {exportSettings.language === 'ar' ? d.holiday.nameAr : d.holiday.nameEn}
                                </div>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-5">
                       {monthData.days.map((d, i) => (
                          <div key={i} className={`flex items-center gap-8 p-8 border-4 rounded-[2.5rem] shadow-sm transition-colors ${d.holiday ? (isDarkMode ? 'bg-red-950/50 border-red-900' : 'bg-red-50 border-red-100') : (isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-50')}`}>
                             <div className={`w-32 text-center shrink-0 ${exportSettings.language === 'ar' ? `border-l-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-50'} pl-8` : `border-r-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-50'} pr-8`}`}>
                                <div className="text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">{translations[exportSettings.language].daysShort[d.date.getDay()]}</div>
                                <div className={`text-5xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-[#003D4F]'}`}>{d.day}</div>
                             </div>
                             <div className="flex-1 flex flex-wrap gap-4">
                                {(['A', 'B', 'C', 'D'] as ShiftGroup[]).map(g => {
                                   const shift = d.shifts[g];
                                   if (exportSettings.selectedShift !== 'ALL' && exportSettings.selectedShift !== g) return null;
                                   return (
                                     <div key={g} className={`flex items-center gap-4 px-6 py-3 rounded-2xl text-lg font-black border-2 shadow-sm ${shiftColors[shift]} ${isDarkMode && shift === ShiftType.OFF ? 'border-gray-700 bg-gray-700 text-gray-500' : ''}`}>
                                        <span className="opacity-60">{translations[exportSettings.language].shift} {g}</span>
                                        <span className="uppercase">{getTranslatedShiftFull(shift, exportSettings.language)}</span>
                                     </div>
                                   );
                                })}
                             </div>
                             {d.holiday && (
                              <div className={`w-48 font-black text-red-600 text-sm flex items-center gap-2 leading-tight ${exportSettings.language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}>
                                <span className="shrink-0">{getHolidayIcon(d.holiday.type, 16)}</span>
                                {exportSettings.language === 'ar' ? d.holiday.nameAr : d.holiday.nameEn}
                              </div>
                             )}
                          </div>
                       ))}
                    </div>
                  )}
                </div>
              ))}
           </div>
        </div>
      </div>

      <footer className={`mt-12 text-center text-xs py-8 border-t transition-colors ${isDarkMode ? 'text-gray-500 border-gray-800' : 'text-gray-400 border-gray-100'}`}>
        {t.copyright}
      </footer>
    </div>
  );
};

export default App;
