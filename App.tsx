import React, { useState, useEffect } from 'react';
import { InputRange } from './components/InputRange';
import { NumberTicker } from './components/NumberTicker';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  // State for inputs
  const [sessionPrice, setSessionPrice] = useState<number>(250);
  const sessionDuration = 60; 
  const [weeklyCapacity, setWeeklyCapacity] = useState<number>(20);
  const [currentPatients, setCurrentPatients] = useState<number>(12);

  // Logic to prevent current patients > capacity
  useEffect(() => {
    if (currentPatients > weeklyCapacity) {
      setCurrentPatients(weeklyCapacity);
    }
  }, [weeklyCapacity, currentPatients]);

  // Financial Calculations
  // Weekly (Base)
  const currentWeeklyRevenue = sessionPrice * currentPatients;
  const potentialWeeklyRevenue = sessionPrice * weeklyCapacity;
  const weeklyLoss = potentialWeeklyRevenue - currentWeeklyRevenue;

  // Monthly (x4 weeks assumption)
  const weeksPerMonth = 4;
  const monthlyLoss = weeklyLoss * weeksPerMonth;

  // Annual
  const annualLoss = monthlyLoss * 12;

  // Time Calculations
  const visualGridTotalSlots = 40; 
  
  const hoursWorkedWeekly = (currentPatients * sessionDuration) / 60;
  const hoursLostWeekly = ((weeklyCapacity - currentPatients) * sessionDuration) / 60;
  // "Free" hours now includes unused slots within the 40-slot grid
  const hoursFreeWeekly = ((visualGridTotalSlots - weeklyCapacity) * sessionDuration) / 60;

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Format time helper (Hours and Minutes)
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
      
      {/* Header */}
      <header className="mb-8 text-center max-w-3xl w-full">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Calculadora <span className="text-emerald-700">Terapeuta 10x</span>
        </h1>
        <p className="mt-2 text-slate-500 text-sm font-medium">
          Descubra quanto dinheiro você está deixando na mesa
        </p>
      </header>

      {/* Split Layout Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: Inputs & Results */}
        <div className="space-y-6 w-full max-w-md mx-auto lg:max-w-none">
          
          {/* Input Section - Increased Padding */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <InputRange
              label="Valor da Sessão"
              value={sessionPrice}
              min={50}
              max={500}
              step={10}
              unit="R$ "
              onChange={setSessionPrice}
              colorClass="text-emerald-600"
            />

            <InputRange
              label="Capacidade Semanal"
              value={weeklyCapacity}
              min={1}
              max={40}
              onChange={setWeeklyCapacity}
              colorClass="text-slate-900"
            />

            <InputRange
              label="Pacientes Atuais"
              value={currentPatients}
              min={0}
              max={weeklyCapacity} // Dynamic Max
              onChange={setCurrentPatients}
              colorClass="text-slate-600"
            />
          </section>

          {/* Results Section - Increased Spacing */}
          <section className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              {/* Block 1: Reality (Now Weekly) */}
              <div className="bg-white border-l-4 border-slate-400 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Faturamento Semanal</p>
                <div className="text-xl sm:text-2xl font-bold text-slate-700 leading-tight">
                  <NumberTicker value={currentWeeklyRevenue} format={formatCurrency} />
                </div>
              </div>

              {/* Block 2: Potential (Now Weekly) */}
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Potencial Semanal</p>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 leading-tight">
                  <NumberTicker value={potentialWeeklyRevenue} format={formatCurrency} />
                </div>
              </div>
            </div>

            {/* Block 3: THE PAIN (Highlight) - Added Weekly Loss */}
            <div className="relative overflow-hidden bg-rose-600 text-white p-6 rounded-2xl shadow-2xl shadow-rose-200 transform transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-rose-200 animate-pulse" />
                  <h2 className="text-sm font-bold tracking-[0.2em] text-rose-100 uppercase">
                    Dinheiro na Mesa
                  </h2>
                </div>

                <div className="flex justify-between items-end">
                  {/* Left: Monthly Loss (Main) */}
                  <div>
                     <div className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-1">
                        <NumberTicker value={monthlyLoss} format={formatCurrency} />
                     </div>
                     <div className="text-rose-200 text-sm font-medium">prejuízo mensal</div>
                  </div>

                  {/* Right: Weekly & Annual Breakdown */}
                  <div className="flex flex-col gap-3 text-right">
                    
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-rose-200">Semanal</span>
                      <span className="text-lg font-bold leading-none">
                        <NumberTicker value={weeklyLoss} format={formatCurrency} />
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-rose-200">Anual</span>
                      <span className="text-lg font-bold leading-none bg-rose-800/40 px-2 py-0.5 rounded shadow-inner">
                        <NumberTicker value={annualLoss} format={formatCurrency} />
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* NEW SECTION: Time Report */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {/* Worked */}
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-slate-800 leading-none">
                  <NumberTicker value={hoursWorkedWeekly} format={formatTime} />
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Trabalho</span>
              </div>

              {/* Lost (Idle/Vaga) */}
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-bold text-rose-700 leading-none">
                  <NumberTicker value={hoursLostWeekly} format={formatTime} />
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-400 mt-1">Ocioso</span>
              </div>

               {/* Free (Rest) */}
               <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center justify-center text-center opacity-80">
                <span className="text-xl sm:text-2xl font-bold text-slate-600 leading-none">
                  <NumberTicker value={hoursFreeWeekly} format={formatTime} />
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Livre</span>
              </div>
            </div>

          </section>
        </div>

        {/* RIGHT COLUMN: Visual Calendar */}
        {/* Changed max-w-md to max-w-xl to allow more width on mobile/tablet */}
        <div className="w-full max-w-xl mx-auto lg:max-w-none lg:sticky lg:top-8 h-fit">
          <WeeklyCalendar 
            currentPatients={currentPatients}
            weeklyCapacity={weeklyCapacity}
            sessionPrice={sessionPrice}
          />
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-12 text-center pb-8">
        <p className="text-xs text-slate-400">
          *Cálculo estimativo baseado em 4 semanas/mês.
        </p>
      </footer>
    </div>
  );
};

export default App;