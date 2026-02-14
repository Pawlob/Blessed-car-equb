import React, { useState, useEffect, useRef } from 'react';
import { Trophy, ChevronRight, Play, Car, Users, ShieldCheck, Ticket, Gem } from 'lucide-react';
import Features from './Features';
import SocialProofSection from './SocialProofSection';
import { TRANSLATIONS } from '../constants';
import { Language, ViewState, AppSettings } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LandingPageProps {
  language: Language;
  setView: (view: ViewState) => void;
  settings: AppSettings;
  enablePreloader?: boolean;
  onPreloaderComplete?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  language, 
  setView, 
  settings, 
  enablePreloader = true, 
  onPreloaderComplete 
}) => {
  const [isLoading, setIsLoading] = useState(enablePreloader);
  const [tickets, setTickets] = useState<{number: string, isTaken: boolean}[]>([]);
  const t = TRANSLATIONS[language];
  
  // Fetch Realtime Tickets with Rolling Growth Logic
  useEffect(() => {
    // Subscribe to real-time ticket updates for current cycle
    const q = query(
        collection(db, 'tickets'), 
        where('cycle', '==', settings.cycle),
        where('status', '==', 'ACTIVE')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const takenSet = new Set<number>();
        
        snapshot.forEach(doc => {
            takenSet.add(doc.data().ticketNumber);
        });

        /**
         * ROLLING GROWTH LOGIC:
         * 1. Start with 100 tickets.
         * 2. Trigger: Expansion happens ONLY when 98% full.
         * 3. Action: Add 100 more spots.
         * 
         * Formula: 100 * (Math.floor(takenCount / 98) + 1)
         */
        const takenCount = takenSet.size;
        const dynamicLimit = 100 * (Math.floor(takenCount / 98) + 1);
        
        const newGrid = Array.from({ length: dynamicLimit }, (_, i) => ({
            number: (i + 1).toString(),
            isTaken: takenSet.has(i + 1)
        }));
        setTickets(newGrid);
    });

    return () => unsubscribe();
  }, [settings.cycle]);

  useEffect(() => {
    if (!enablePreloader) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
      if (onPreloaderComplete) onPreloaderComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [enablePreloader, onPreloaderComplete]);

  const scrollToWaitlist = () => {
    const element = document.getElementById('waitlist-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900 to-stone-950"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col items-center">
           {/* Logo Animation */}
           <div className="relative mb-8 group">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
              <div className="w-24 h-24 bg-stone-900 rounded-2xl border border-stone-800 flex items-center justify-center relative z-10 shadow-2xl ring-1 ring-white/10">
                 <Gem className="w-10 h-10 text-emerald-500 absolute animate-ping opacity-20" />
                 <Gem className="w-10 h-10 text-amber-500 relative z-20" />
              </div>
           </div>
           
           {/* Text */}
           <h1 className="text-3xl font-bold text-white mb-3 tracking-widest uppercase flex items-center gap-2">
             Blessed <span className="text-amber-500">የመኪና ዕቁብ</span>
           </h1>
           <p className="text-stone-500 text-xs tracking-[0.3em] uppercase mb-12">
               {language === 'en' ? 'Digital Future' : 'የዲጂታል ዘመን እቁብ'}
           </p>
   
           {/* Loading Bar */}
           <div className="w-48 h-1 bg-stone-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 w-[200%] animate-[shimmer_2s_infinite_linear]"></div>
           </div>
           
           <style>{`
             @keyframes shimmer {
               0% { transform: translateX(-100%); }
               100% { transform: translateX(50%); }
             }
           `}</style>
        </div>
      </div>
    );
  }

  return (
    <>
      <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-stone-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 opacity-95"></div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-800/30 border border-emerald-700/50 text-emerald-300 text-sm font-semibold mb-2 animate-fade-in-down">
              <Trophy className="w-4 h-4 mr-2 text-amber-400" />
              {t.hero.subtitle} {language === 'en' ? `${settings.daysRemaining} Days` : `${settings.daysRemaining} ቀናት`}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight animate-fade-in-up">
              {t.hero.title1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">
                {t.hero.title2}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-stone-300 max-w-lg mx-auto md:mx-0 leading-relaxed animate-fade-in-up delay-[100ms]">
              {t.hero.desc}
            </p>
            
            <div className="flex flex-row items-center space-x-3 justify-center md:justify-start pt-4 w-full sm:w-auto animate-fade-in-up delay-[200ms]">
              <button 
                onClick={scrollToWaitlist}
                className="flex-1 sm:flex-none sm:w-auto px-4 sm:px-8 py-4 bg-red-900 hover:bg-red-800 text-white rounded-lg font-bold text-sm sm:text-lg shadow-xl shadow-red-900/20 transition-all hover:-translate-y-1 flex items-center justify-center whitespace-nowrap"
              >
                {t.hero.cta}
                <ChevronRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button className="flex-1 sm:flex-none sm:w-auto px-4 sm:px-8 py-4 bg-stone-800 hover:bg-stone-700 text-white border border-stone-600 rounded-lg font-bold text-sm sm:text-lg transition-all flex items-center justify-center whitespace-nowrap">
                <Play className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="currentColor" />
                {t.hero.watch}
              </button>
            </div>
          </div>

          <div className="relative -mt-8 md:mt-0 animate-fade-in-up delay-[300ms]">
            <div className="relative z-10 bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl border border-stone-700 p-2 shadow-2xl animate-wiggle-interval">
              <div className="bg-stone-800/50 rounded-xl overflow-hidden relative group">
                  <div className="h-64 md:h-80 bg-stone-700 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-emerald-900/20 group-hover:bg-emerald-900/10 transition-colors"></div>
                      
                      {/* Ribbon Overlay */}
                      <div className="absolute inset-0 z-10 pointer-events-none opacity-100">
                          {/* Bow Image */}
                          <div className="absolute top-52 left-52  -translate-x-24 -translate-y-24 w-64 h-64 flex items-center justify-center z-20">
                               <img 
                                 src="https://i.postimg.cc/hvkdcQC4/rebbon-final.png" 
                                 alt="Ribbon" 
                                 className="w-full h-full object-contain drop-shadow-2xl scale-[2]"
                               />
                          </div>
                      </div>

                      <img 
                        src={settings.prizeImage}
                        alt={settings.prizeName} 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                      
                      <div className="absolute inset-0 flex items-end justify-end z-20 p-4">
                          <span className="text-stone-100 font-bold text-sm md:text-base border border-dashed border-stone-500/50 bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-lg shadow-xl transform rotate-[-2deg]">
                              {settings.prizeName}
                          </span>
                      </div>
                  </div>
                  
                  <div className="p-6">
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-amber-500 text-sm font-bold uppercase tracking-wider mb-1">{t.hero.prize_label}</p>
                              <h3 className="text-2xl font-bold text-white">Luxury Package</h3>
                          </div>
                          <div className="text-right">
                              <p className="text-stone-400 text-xs">{t.hero.prize_value}</p>
                              <p className="text-xl font-bold text-white">{settings.prizeValue}</p>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Status Bar - TABLE BOARD DISPLAY */}
      <div className="bg-amber-900 text-white py-12 relative z-20 -mt-8 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center mb-4 md:mb-0">
                <Ticket className="w-6 h-6 mr-2 text-amber-400" />
                {language === 'en' ? "Live Ticket Status" : "የእጣ ቁጥሮች ሁኔታ"}
                </h3>
                <div className="flex space-x-6 text-sm bg-black/20 px-4 py-2 rounded-full">
                  <div className="flex items-center">
                      <span className="w-3 h-3 rounded bg-amber-900/50 border border-amber-700 mr-2"></span>
                      <span className="text-stone-300 font-medium">{t.stats.taken}</span>
                  </div>
                  <div className="flex items-center">
                      <span className="w-3 h-3 rounded bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] mr-2"></span>
                      <span className="text-emerald-200 font-medium">{t.stats.lucky}</span>
                  </div>
                </div>
            </div>

            {/* Ticket Table Board */}
            <div className="relative">
                 {/* Decorative background glow */}
                 <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>

                 <div className="relative grid grid-cols-10 sm:grid-cols-25 gap-1.5 p-2 bg-stone-900/60 rounded-xl border border-amber-900/30 backdrop-blur-sm max-w-5xl mx-auto">
                    {tickets.map((ticket, i) => (
                        <div 
                          key={i} 
                          onClick={scrollToWaitlist}
                          className={`
                            aspect-square rounded flex items-center justify-center font-extrabold text-[12px] sm:text-lg border transition-all duration-500 cursor-pointer
                            ${ticket.isTaken 
                            ? 'bg-amber-950/40 border-amber-900/30 text-stone-600' 
                            : 'bg-emerald-600 text-white border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)] transform hover:scale-110 hover:bg-emerald-500 hover:z-10'}
                        `}>
                            {ticket.number}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="text-center mt-6">
                <p className="text-amber-200/60 text-xs uppercase tracking-widest">
                  {language === 'en' ? 'Real-time Availability' : 'የእጣ ቁጥሮች ሁኔታ በቅጽበት'}
                </p>
            </div>
        </div>
      </div>
      
      <Features language={language} />
      <SocialProofSection language={language} />
      
      <section id="waitlist-section" className="py-16 bg-white text-center">
          <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-emerald-900 mb-6">{t.cta_section.heading}</h2>
              {t.cta_section.desc && <p className="text-stone-600 mb-8">{t.cta_section.desc}</p>}
              <button onClick={() => setView('login')} className="px-10 py-4 bg-red-900 hover:bg-red-800 text-white rounded-full font-bold text-xl shadow-xl transform transition-transform hover:scale-105">
                  {t.cta_section.btn}
              </button>
          </div>
      </section>
    </>
  );
};

export default LandingPage;