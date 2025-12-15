import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Utensils, AlertTriangle, TrendingUp, Clock, Wallet, Info } from 'lucide-react';

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

// --- COMPONENT: RangeInput ---
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
    <div className="mb-6 w-full last:mb-0 group">
      <div className="flex justify-between items-end mb-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
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
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all hover:bg-slate-300"
      />
      <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
        <span>{unit}{min}</span>
        <span>{unit}{max}</span>
      </div>
    </div>
  );
};

// --- COMPONENT: AnimatedCounter ---
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, format, className }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 800; 
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
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

// --- COMPONENT: VisualCalendar ---
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

  const weeksPerMonth = 4;
  
  // Weekly Calculations (for Logic)
  const currentWeeklyRevenue = sessionPrice * currentPatients;
  const potentialWeeklyRevenue = sessionPrice * weeklyCapacity;
  const weeklyLoss = potentialWeeklyRevenue - currentWeeklyRevenue;

  // Monthly Calculations (for Display)
  const currentMonthlyRevenue = currentWeeklyRevenue * weeksPerMonth;
  const potentialMonthlyRevenue = potentialWeeklyRevenue * weeksPerMonth;
  const monthlyLoss = weeklyLoss * weeksPerMonth;
  const annualLoss = monthlyLoss * 12;

  const occupancyRate = weeklyCapacity > 0 ? (currentPatients / weeklyCapacity) * 100 : 0;
  const revenueIncreasePotential = currentMonthlyRevenue > 0 
    ? ((potentialMonthlyRevenue - currentMonthlyRevenue) / currentMonthlyRevenue) * 100 
    : 100;

  const visualGridTotalSlots = 40; 
  const hoursWorkedWeekly = (currentPatients * sessionDuration) / 60;
  const hoursLostWeekly = ((weeklyCapacity - currentPatients) * sessionDuration) / 60;
  const hoursFreeWeekly = ((visualGridTotalSlots - weeklyCapacity) * sessionDuration) / 60;
  const totalHours = hoursWorkedWeekly + hoursLostWeekly + hoursFreeWeekly;

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
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <header className="mb-10 text-center max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Calculadora <span className="text-emerald-700">Terapeuta 10x</span>
        </h1>
        <p className="mt-2 text-slate-500 text-sm font-medium">
          Simule o impacto financeiro de otimizar sua agenda
        </p>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: Controls & Dashboard */}
        <div className="space-y-8 w-full max-w-md mx-auto lg:max-w-none">
          
          {/* Controls */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
              Parâmetros da Clínica
            </h3>
            
            <RangeInput label="Valor da Sessão" value={sessionPrice} min={50} max={600} step={10} unit="R$ " onChange={setSessionPrice} colorClass="text-emerald-600" />
            <RangeInput label="Capacidade Semanal (Vagas)" value={weeklyCapacity} min={1} max={40} onChange={setWeeklyCapacity} colorClass="text-slate-900" />
            <RangeInput label="Pacientes Atuais" value={currentPatients} min={0} max={weeklyCapacity} onChange={setCurrentPatients} colorClass="text-slate-600" />
            
            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
               <span>Ocupação atual: <strong className={occupancyRate < 50 ? 'text-rose-500' : 'text-emerald-600'}>{Math.round(occupancyRate)}%</strong></span>
               <span>Meta: 100%</span>
            </div>
          </section>

          {/* Results Dashboard */}
          <section className="space-y-6">
            
            {/* 1. Revenue Health Card (MONTHLY FOCUSED) */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Wallet size={14} /> Saúde Financeira (Mensal)
                </h3>
                {revenueIncreasePotential > 0 && (
                   <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                     <TrendingUp size={10} /> Potencial de +{Math.round(revenueIncreasePotential)}%
                   </span>
                )}
              </div>

              <div className="flex justify-between items-end mb-2">
                <div>
                   <span className="text-xs text-slate-400 font-medium block mb-0.5">Faturamento Mensal</span>
                   <span className="text-2xl font-bold text-slate-700 block leading-none">
                      <AnimatedCounter value={currentMonthlyRevenue} format={formatCurrency} />
                   </span>
                </div>
                <div className="text-right">
                   <span className="text-xs text-emerald-600 font-bold block mb-0.5">Potencial Mensal</span>
                   <span className="text-lg font-bold text-emerald-600 block leading-none">
                      <AnimatedCounter value={potentialMonthlyRevenue} format={formatCurrency} />
                   </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                <div 
                  className="absolute top-0 left-0 h-full bg-slate-800 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${occupancyRate}%` }}
                ></div>
                {occupancyRate < 100 && (
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-400 opacity-30 animate-pulse transition-all duration-700 ease-out"
                    style={{ width: '100%', left: `${occupancyRate}%` }}
                  ></div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 text-center w-full">
                Considerando 4 semanas comerciais
              </p>
            </div>

            {/* 2. Impact / Loss Card (Red) - CLEANED UP */}
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-600 to-rose-700 text-white p-6 rounded-2xl shadow-[0_10px_40px_-10px_rgba(225,29,72,0.5)] transform hover:scale-[1.01] transition-all duration-300">
               {/* Background decorations */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-black opacity-10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-sm font-bold tracking-widest text-rose-100 uppercase">
                    Dinheiro na Mesa
                  </h2>
                </div>

                <div className="flex flex-col gap-1 mb-8">
                   <span className="text-rose-200 text-sm font-medium">Você está perdendo por ano:</span>
                   <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                      <AnimatedCounter value={annualLoss} format={formatCurrency} />
                   </div>
                </div>

                {/* Simplified Monthly View */}
                <div className="bg-rose-800/30 rounded-xl p-3 flex justify-between items-center border border-rose-500/30">
                   <span className="text-xs font-bold text-rose-100 uppercase tracking-wide opacity-90 pl-1">
                     Isso é um prejuízo mensal de:
                   </span>
                   <div className="text-xl font-bold leading-none bg-rose-900/40 px-3 py-1.5 rounded-lg border border-rose-500/20">
                     <AnimatedCounter value={monthlyLoss} format={formatCurrency} />
                   </div>
                </div>
              </div>
            </div>

            {/* 3. Time Composition Stats */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                  <Clock size={14} /> Distribuição de Tempo (Semanal)
               </h3>
               
               {/* Visual Bar */}
               <div className="flex h-4 w-full rounded-full overflow-hidden mb-4">
                  <div className="bg-slate-800 transition-all duration-500" style={{ width: `${(hoursWorkedWeekly/totalHours)*100}%` }}></div>
                  <div className="bg-rose-500 transition-all duration-500" style={{ width: `${(hoursLostWeekly/totalHours)*100}%` }}></div>
                  <div className="bg-slate-200 transition-all duration-500" style={{ width: `${(hoursFreeWeekly/totalHours)*100}%` }}></div>
               </div>

               <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center">
                     <span className="text-lg font-bold text-slate-800 leading-none">
                        <AnimatedCounter value={hoursWorkedWeekly} format={formatTime} />
                     </span>
                     <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Produtivo</span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                     <span className="text-lg font-bold text-rose-600 leading-none">
                        <AnimatedCounter value={hoursLostWeekly} format={formatTime} />
                     </span>
                     <div className="flex items-center gap-1 mt-1">
                         <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                         <span className="text-[10px] font-bold text-rose-500 uppercase">Ocioso</span>
                     </div>
                  </div>

                  <div className="flex flex-col items-center opacity-60">
                     <span className="text-lg font-bold text-slate-500 leading-none">
                        <AnimatedCounter value={hoursFreeWeekly} format={formatTime} />
                     </span>
                     <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Livre</span>
                     </div>
                  </div>
               </div>
            </div>

          </section>
        </div>

        {/* RIGHT COLUMN: Visual Calendar */}
        <div className="w-full max-w-xl mx-auto lg:max-w-none lg:sticky lg:top-8 h-fit">
          <VisualCalendar currentPatients={currentPatients} weeklyCapacity={weeklyCapacity} sessionPrice={sessionPrice} />
          
          <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start text-blue-800 text-sm">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
            <p className="leading-relaxed opacity-90">
              <strong>Dica:</strong> Cada bloco vazio no calendário representa <span className="font-bold text-rose-600">R$ {sessionPrice}</span> que deixa de entrar no seu caixa.
              Visualizar os "buracos" na agenda ajuda a entender o impacto acumulado.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-16 text-center border-t border-slate-200 w-full max-w-2xl pt-8">
        <p className="text-xs text-slate-400">
          Calculadora desenvolvida para terapeutas visualizarem o custo de oportunidade.
          <br/>Considera mês comercial de 4 semanas.
        </p>
      </footer>
    </div>
  );
};

export default App;