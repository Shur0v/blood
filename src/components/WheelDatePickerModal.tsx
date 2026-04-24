import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";

type PickerTheme = "dark" | "light";

interface WheelDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  initialDate?: string;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  clearLabel?: string;
  allowClear?: boolean;
  minDate?: Date;
  maxDate?: Date;
  theme?: PickerTheme;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseIsoDate = (value?: string): Date | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const normalizeToDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const clampDate = (date: Date, minDate?: Date, maxDate?: Date): Date => {
  const normalized = normalizeToDay(date);
  const min = minDate ? normalizeToDay(minDate) : null;
  const max = maxDate ? normalizeToDay(maxDate) : null;
  if (min && normalized < min) return min;
  if (max && normalized > max) return max;
  return normalized;
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDay = (date: Date) => String(date.getDate()).padStart(2, "0");
const formatMonth = (date: Date) => MONTHS_SHORT[date.getMonth()];
const formatYear = (date: Date) => String(date.getFullYear());

export default function WheelDatePickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialDate,
  title = "Select Date",
  subtitle = "Use arrows to adjust day, month and year.",
  confirmLabel = "Confirm Date",
  clearLabel = "Clear Date",
  allowClear = false,
  minDate,
  maxDate,
  theme = "dark",
}: WheelDatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => clampDate(new Date(), minDate, maxDate));

  useEffect(() => {
    if (!isOpen) return;
    const parsed = parseIsoDate(initialDate);
    setSelectedDate(clampDate(parsed ?? new Date(), minDate, maxDate));
  }, [initialDate, isOpen, minDate, maxDate]);

  const themeClasses = useMemo(() => {
    if (theme === "light") {
      return {
        panel: "border-gray-200 bg-white text-gray-900",
        subtitle: "text-gray-500",
        col: "border-gray-200 bg-gray-50/80",
        rowMuted: "text-gray-400",
        rowActive: "text-gray-900",
        activeUnderline: "bg-sky-400",
        control: "border-gray-200 text-gray-600 hover:bg-gray-100",
        clear: "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200",
        confirm: "bg-primary text-white shadow-lg shadow-primary/20",
      };
    }
    return {
      panel: "border-white/10 bg-[#0f172acc] text-white",
      subtitle: "text-white/50",
      col: "border-white/10 bg-white/5",
      rowMuted: "text-white/40",
      rowActive: "text-white",
      activeUnderline: "bg-sky-300",
      control: "border-white/10 text-white/70 hover:bg-white/10",
      clear: "border-white/10 bg-white/10 text-white/80 hover:bg-white/20",
      confirm: "bg-primary text-white shadow-lg shadow-primary/20",
    };
  }, [theme]);

  const adjustDate = (part: "day" | "month" | "year", delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (part === "day") {
        next.setDate(next.getDate() + delta);
      } else if (part === "month") {
        next.setMonth(next.getMonth() + delta);
      } else {
        next.setFullYear(next.getFullYear() + delta);
      }
      return clampDate(next, minDate, maxDate);
    });
  };

  const dayPrev = clampDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1), minDate, maxDate);
  const dayNext = clampDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1), minDate, maxDate);
  const monthPrev = clampDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, selectedDate.getDate()), minDate, maxDate);
  const monthNext = clampDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate()), minDate, maxDate);
  const yearPrev = clampDate(new Date(selectedDate.getFullYear() - 1, selectedDate.getMonth(), selectedDate.getDate()), minDate, maxDate);
  const yearNext = clampDate(new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth(), selectedDate.getDate()), minDate, maxDate);

  const handleConfirm = () => {
    onConfirm(toIsoDate(selectedDate));
    onClose();
  };

  const handleClear = () => {
    onConfirm("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            className={`relative w-full max-w-sm rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl ${themeClasses.panel}`}
          >
            <div className="mb-4 text-center">
              <h3 className="text-sm font-black uppercase tracking-wider">{title}</h3>
              <p className={`mt-1 text-[11px] ${themeClasses.subtitle}`}>{subtitle}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-2xl border p-2 ${themeClasses.col}`}>
                <button type="button" onClick={() => adjustDate("day", -1)} className={`mb-1 flex w-full items-center justify-center rounded-lg border py-1 ${themeClasses.control}`}>
                  <ChevronUp className="h-4 w-4" />
                </button>
                <div className="space-y-1 text-center">
                  <div className={`text-lg font-semibold ${themeClasses.rowMuted}`}>{formatDay(dayPrev)}</div>
                  <div className={`relative text-xl font-black ${themeClasses.rowActive}`}>
                    {formatDay(selectedDate)}
                    <span className={`absolute -bottom-1 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full ${themeClasses.activeUnderline}`} />
                  </div>
                  <div className={`text-lg font-semibold ${themeClasses.rowMuted}`}>{formatDay(dayNext)}</div>
                </div>
                <button type="button" onClick={() => adjustDate("day", 1)} className={`mt-1 flex w-full items-center justify-center rounded-lg border py-1 ${themeClasses.control}`}>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className={`rounded-2xl border p-2 ${themeClasses.col}`}>
                <button type="button" onClick={() => adjustDate("month", -1)} className={`mb-1 flex w-full items-center justify-center rounded-lg border py-1 ${themeClasses.control}`}>
                  <ChevronUp className="h-4 w-4" />
                </button>
                <div className="space-y-1 text-center">
                  <div className={`text-lg font-semibold ${themeClasses.rowMuted}`}>{formatMonth(monthPrev)}</div>
                  <div className={`relative text-xl font-black ${themeClasses.rowActive}`}>
                    {formatMonth(selectedDate)}
                    <span className={`absolute -bottom-1 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full ${themeClasses.activeUnderline}`} />
                  </div>
                  <div className={`text-lg font-semibold ${themeClasses.rowMuted}`}>{formatMonth(monthNext)}</div>
                </div>
                <button type="button" onClick={() => adjustDate("month", 1)} className={`mt-1 flex w-full items-center justify-center rounded-lg border py-1 ${themeClasses.control}`}>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className={`rounded-2xl border p-2 ${themeClasses.col}`}>
                <button type="button" onClick={() => adjustDate("year", -1)} className={`mb-1 flex w-full items-center justify-center rounded-lg border py-1 ${themeClasses.control}`}>
                  <ChevronUp className="h-4 w-4" />
                </button>
                <div className="space-y-1 text-center">
                  <div className={`text-lg font-semibold ${themeClasses.rowMuted}`}>{formatYear(yearPrev)}</div>
                  <div className={`relative text-xl font-black ${themeClasses.rowActive}`}>
                    {formatYear(selectedDate)}
                    <span className={`absolute -bottom-1 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full ${themeClasses.activeUnderline}`} />
                  </div>
                  <div className={`text-lg font-semibold ${themeClasses.rowMuted}`}>{formatYear(yearNext)}</div>
                </div>
                <button type="button" onClick={() => adjustDate("year", 1)} className={`mt-1 flex w-full items-center justify-center rounded-lg border py-1 ${themeClasses.control}`}>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {allowClear && (
                <button type="button" onClick={handleClear} className={`flex-1 rounded-2xl border py-3 text-[11px] font-black uppercase tracking-widest transition ${themeClasses.clear}`}>
                  {clearLabel}
                </button>
              )}
              <button type="button" onClick={handleConfirm} className={`rounded-2xl py-3 text-[11px] font-black uppercase tracking-widest ${allowClear ? "flex-1" : "w-full"} ${themeClasses.confirm}`}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

