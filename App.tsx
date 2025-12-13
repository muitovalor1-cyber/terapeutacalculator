import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Utensils, AlertTriangle } from 'lucide-react';

// --- TYPES DEFINITIONS ---
interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  colorClass?: string;
}

interface AnimatedCounterProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

interface VisualCalendarProps {
  currentPatients: number;
  weeklyCapacity: number;
  sessionPrice: number;
}

// --- COMPONENT: RangeInput (Antigo SimpleRange) ---
const RangeInput: React.FC<RangeInputProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  unit = '', 
  onChange,
  colorClass = "text-slate-900" 
}) => {
  return (
    <div className="mb-7 w-full last:mb-0">
      <div className="flex justify-between items-end mb-3">
        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
        <span className={`text-xl font-bold leading-none ${colorClass}`}>
          {unit}{value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
      <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
        <span>{unit}{min}</span>
        <span>{unit}{max}</span>
      </div>
    </div>
  );
};

// --- COMPONENT: AnimatedCounter (Antigo NumberTicker) ---
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, format, className }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 600; 
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (endValue - startValue) * easeProgress;
      
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  const formattedValue = format ? format(displayValue) : Math.round(displayValue).toString();
  return <span className={className}>{formattedValue}</span>;
};

// --- COMPONENT: VisualCalendar (Antigo WeeklyCalendar) ---
const VisualCalendar: React.FC<VisualCalendarProps> = ({ currentPatients, weeklyCapacity, sessionPrice }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(currentDate);
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      name: d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3).toUpperCase(),
      date: d.getDate(),
      fullDate: d,
      isToday: d.toDateString() === new Date().toDateString()
    };
  });

  const monthName = monday.toLocaleDateString('pt-BR', { month: 'long' });
  const year = monday.getFullYear();

  const startHour = 9; 
  const endHour = 18; 
  const hoursArray = useMemo(() => {
    const arr = [];
    for (let i = startHour; i < endHour; i++) arr.push(i);
    return arr;
  }, []);
  
  const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);

  useEffect(() => {
    const updateTimePosition = () => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const isMobile = window.innerWidth < 640;
      const rowHeight = isMobile ? 56 : 80;

      if (currentH >= startHour && currentH < endHour) {
        const hoursPassed = currentH - startHour;
        const minutesFraction = currentM / 60;
        const pixelOffset = (hoursPassed + minutesFraction) * rowHeight;
        setCurrentTimePos(pixelOffset);
      } else {
        setCurrentTimePos(null);
      }
    };

    updateTimePosition();
    const interval = setInterval(updateTimePosition, 60000); 
    window.addEventListener('resize', updateTimePosition);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateTimePosition);
    };
  }, []);

  const slotStatusMap = useMemo(() => {
    const map = new Map<string, 'occupied' | 'loss' | 'free'>();
    const validSlots: { dayIdx: number; hour: number }[] = [];
    hoursArray.forEach(hour => {
      if (hour === 12) return;
      days.forEach((_, dayIdx) => {
        validSlots.push({ dayIdx, hour });
      });
    });

    let seed = 123456; 
    const seededRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const shuffled = [...validSlots];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    shuffled.forEach((slot, index) => {
      let status: 'occupied' | 'loss' | 'free' = 'free';
      if (index < currentPatients) status = 'occupied';
      else if (index < weeklyCapacity) status = 'loss';
      map.set(`${slot.dayIdx}-${slot.hour}`, status);
    });

    return map;
  }, [currentPatients, weeklyCapacity, hoursArray, days.length]);

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col h-auto">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-white z-20 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 sm:gap-6">
           <div className="text-slate-800 flex items-baseline gap-2">
             <span className="text-lg sm:text-2xl font-semibold capitalize tracking-tight">{monthName}</span> 
             <span className="text-slate-500 font-normal text-base sm:text-xl">{year}</span>
           </div>
           <div className="flex items-center gap-1 text-slate-500">
             <button className="p-1 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5}/></button>
             <button className="p-1 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5}/></button>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-slate-600">
                <div className="w-2.5 h-2.5 rounded-sm bg-sky-600 shadow-sm"></div>
                Ocupado
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <div className="w-2.5 h-2.5 rounded-sm bg-white border-2 border-rose-400"></div>
                Vago
              </span>
           </div>
           <div className="h-7 w-7 sm:h-9 sm:w-9 bg-sky-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md ring-2 ring-sky-100">T</div>
        </div>
      </div>

      <div className="flex flex-col bg-white">
        <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="w-10 sm:w-12 flex-shrink-0 bg-white border-r border-slate-100"></div> 
          {days.map((day, i) => (
            <div key={i} className="flex-1 py-2 sm:py-4 text-center border-r border-slate-100 last:border-r-0">
              <div className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1 ${day.isToday ? 'text-sky-600' : 'text-slate-500'}`}>
                {day.name}
              </div>
              <div className={`text-base sm:text-2xl font-medium w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center mx-auto rounded-full transition-all duration-300
                ${day.isToday ? 'bg-sky-600 text-white shadow-lg shadow-sky-200 scale-110' : 'text-slate-700 hover:bg-slate-50'}
              `}>
                {day.date}
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          {currentTimePos !== null && (
            <div className="absolute left-10 sm:left-12 right-0 z-30 pointer-events-none flex" style={{ top: `${currentTimePos}px` }}>
              {days.map((day, i) => (
                <div key={i} className="flex-1 relative">
                  {day.isToday && (
                    <>
                       <div className="absolute w-full border-t-2 border-red-500 shadow-[0_1px_2px_rgba(239,68,68,0.4)]"></div>
                       <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm ring-2 ring-white"></div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {hoursArray.map((hour, hIndex) => {
            const isLunch = hour === 12;
            return (
              <div key={hour} className="flex h-14 sm:h-20 border-b border-slate-100 relative group">
                <div className="w-10 sm:w-12 flex-shrink-0 border-r border-slate-100 text-[10px] sm:text-xs text-slate-500 font-medium text-right pr-1.5 sm:pr-2 relative">
                  <span className="absolute -top-2.5 right-1 sm:right-2 bg-white pl-1">{hour.toString().padStart(2, '0')}:00</span>
                </div>
                {days.map((_, dIndex) => {
                  if (isLunch) {
                    return (
                       <div key={`${dIndex}-${hIndex}`} className="flex-1 border-r border-slate-100 last:border-r-0 relative p-0.5 sm:p-1">
                          <div className="w-full h-full rounded-[4px] bg-orange-50 border border-orange-200 flex flex-col items-center justify-center opacity-90">
                              <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 text-orange-400">
                                <Utensils size={12} className="sm:w-[14px] sm:h-[14px]" />
                                <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide hidden min-[350px]:inline">Almoço</span>
                              </div>
                          </div>
                       </div>
                    )
                  }
                  const status = slotStatusMap.get(`${dIndex}-${hour}`) || 'free';
                  return (
                    <div key={`${dIndex}-${hIndex}`} className="flex-1 border-r border-slate-100 last:border-r-0 relative p-0.5 sm:p-1 group/cell hover:bg-slate-50/50 transition-colors">
                      {status !== 'free' && (
                        <div className={`
                          w-full h-full rounded-[3px] sm:rounded-[4px] px-0.5 sm:px-2 py-0.5 sm:py-1.5 flex flex-col justify-center sm:justify-start shadow-[0_1px_2px_rgba(0,0,0,0.08)] 
                          text-[8px] sm:text-xs leading-none sm:leading-tight select-none cursor-default border-l-[2px] sm:border-l-[3px]
                          transition-all duration-500 animate-in fade-in zoom-in-95 origin-top
                          ${status === 'occupied' 
                            ? 'bg-sky-50 border-sky-600 text-sky-800' 
                            : 'bg-white border-rose-500 text-rose-700 border-2 border-l-[2px] sm:border-l-[3px] border-dashed opacity-100'
                          }
                        `}>
                          <div className={`font-bold truncate mb-0.5 ${status === 'loss' ? 'text-[8px] sm:text-[10px]' : ''}`}>
                            {status === 'occupied' ? 'Sessão' : 'VAGO'}
                          </div>
                          <div className={`truncate ${status === 'loss' ? 'font-black text-rose-600 text-[10px] sm:text-sm' : 'opacity-80 font-medium hidden sm:block'}`}>
                            {status === 'occupied' ? 'Confirmado' : `- R$ ${sessionPrice}`}
                          </div>
                          <div className={`truncate font-bold text-rose-600 text-[9px] block sm:hidden ${status === 'loss' ? 'block' : 'hidden'}`}>- R$ {sessionPrice}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [sessionPrice, setSessionPrice] = useState<number>(250);
  const sessionDuration = 60; 
  const [weeklyCapacity, setWeeklyCapacity] = useState<number>(20);
  const [currentPatients, setCurrentPatients] = useState<number>(12);

  useEffect(() => {
    if (currentPatients > weeklyCapacity) {
      setCurrentPatients(weeklyCapacity);
    }
  }, [weeklyCapacity, currentPatients]);

  const currentWeeklyRevenue = sessionPrice * currentPatients;
  const potentialWeeklyRevenue = sessionPrice * weeklyCapacity;
  const weeklyLoss = potentialWeeklyRevenue - currentWeeklyRevenue;
  const weeksPerMonth = 4;
  const monthlyLoss = weeklyLoss * weeksPerMonth;
  const annualLoss = monthlyLoss * 12;

  const visualGridTotalSlots = 40; 
  const hoursWorkedWeekly = (currentPatients * sessionDuration) / 60;
  const hoursLostWeekly = ((weeklyCapacity - currentPatients) * sessionDuration) / 60;
  const hoursFreeWeekly = ((visualGridTotalSlots - weeklyCapacity) * sessionDuration) / 60;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatTime = (decimalHours: number) => {
    const totalMinutes = Math.round(decimalHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    if (totalMinutes === 0) return "0h";
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8 text-center max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Calculadora <span className="text-emerald-700">Terapeuta 10x</span>
        </h1>
        <p className="mt-2 text-slate-500 text-sm font-medium">
          Descubra quanto dinheiro você está deixando na mesa
        </p>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="space-y-6 w-full max-w-md mx-auto lg:max-w-none">
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <RangeInput label="Valor da Sessão" value={sessionPrice} min={50} max={500} step={10} unit="R$ " onChange={setSessionPrice} colorClass="text-emerald-600" />
            <RangeInput label="Capacidade Semanal" value={weeklyCapacity} min={1} max={40} onChange={setWeeklyCapacity} colorClass="text-slate-900" />
            <RangeInput label="Pacientes Atuais" value={currentPatients} min={0} max={weeklyCapacity} onChange={setCurrentPatients} colorClass="text-slate-600" />
          </section>

          <section className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-l-4 border-slate-400 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Faturamento Semanal</p>
                <div className="text-xl sm:text-2xl font-bold text-slate-700 leading-tight">
                  <AnimatedCounter value={currentWeeklyRevenue} format={formatCurrency} />
                </div>
              </div>

              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Potencial Semanal</p>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 leading-tight">
                  <AnimatedCounter value={potentialWeeklyRevenue} format={formatCurrency} />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden bg-rose-600 text-white p-6 rounded-2xl shadow-2xl shadow-rose-200 transform transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-rose-200 animate-pulse" />
                  <h2 className="text-sm font-bold tracking-[0.2em] text-rose-100 uppercase">Dinheiro na Mesa</h2>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                     <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-1">
                        <AnimatedCounter value={monthlyLoss} format={formatCurrency} />
                     </div>
                     <div className="text-rose-200 text-sm font-medium">prejuízo mensal</div>
                  </div>
                  <div className="flex flex-col gap-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-rose-200">Semanal</span>
                      <span className="text-lg font-bold leading-none"><AnimatedCounter value={weeklyLoss} format={formatCurrency} /></span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-rose-200">Anual</span>
                      <span className="text-lg font-bold leading-none bg-rose-800/40 px-2 py-0.5 rounded shadow-inner"><AnimatedCounter value={annualLoss} format={formatCurrency} /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 leading-none"><AnimatedCounter value={hoursWorkedWeekly} format={formatTime} /></span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Trabalho</span>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-rose-700 leading-none"><AnimatedCounter value={hoursLostWeekly} format={formatTime} /></span>
                <span className="text-[10px] uppercase font-bold text-rose-400 mt-1">Ocioso</span>
              </div>
               <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center text-center opacity-80">
                <span className="text-xl sm:text-2xl font-bold text-slate-600 leading-none"><AnimatedCounter value={hoursFreeWeekly} format={formatTime} /></span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Livre</span>
              </div>
            </div>
          </section>
        </div>

        <div className="w-full max-w-xl mx-auto lg:max-w-none lg:sticky lg:top-8 h-fit">
          <VisualCalendar currentPatients={currentPatients} weeklyCapacity={weeklyCapacity} sessionPrice={sessionPrice} />
        </div>
      </div>

      <footer className="mt-12 text-center pb-8">
        <p className="text-xs text-slate-400">*Cálculo estimativo baseado em 4 semanas/mês.</p>
      </footer>
    </div>
  );
};

export default App;