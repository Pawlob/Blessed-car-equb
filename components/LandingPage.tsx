import React, { useState, useEffect, useRef } from 'react';
import { Trophy, ChevronRight, Play, Car, Users, ShieldCheck, Ticket, Gem, Search, CheckCircle, XCircle } from 'lucide-react';
import Features from './Features';
import SocialProofSection from './SocialProofSection';
import { TRANSLATIONS, PRIZE_IMAGES } from '../constants';
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
  const [luckySearch, setLuckySearch] = useState('');
  const [luckyStatus, setLuckyStatus] = useState<'IDLE' | 'AVAILABLE' | 'TAKEN'>('IDLE');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const t = TRANSLATIONS[language];

  // Carousel Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % PRIZE_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  // Fetch Realtime Tickets with Rolling Growth Logic (2% trigger)
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
         * - Starts at 100.
         * - Triggers ONLY when 2% are full (takenCount reaches 2% of the current limit).
         * - Adds 100 more tickets each time.
         * Formula: 100 * (floor(takenCount / 2) + 1)
         */
        const takenCount = takenSet.size;
        const dynamicLimit = 100 * (Math.floor(takenCount / 2) + 1);
        
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

  const handleLuckySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLuckySearch(val);
    
    if (!val) {
        setLuckyStatus('IDLE');
        return;
    }

    const ticket = tickets.find(t => t.number === val);
    if (ticket) {
        setLuckyStatus(ticket.isTaken ? 'TAKEN' : 'AVAILABLE');
    } else {
        // If it's within the current grid range but not found (logic edge case) or outside range
        setLuckyStatus('IDLE');
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
              {settings.daysRemaining === 0 
                ? t.hero.subtitle_today 
                : <>{t.hero.subtitle} {language === 'en' ? `${settings.daysRemaining} DAYS` : `${settings.daysRemaining} ቀናት`}</>
              }
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

                      {/* Carousel Images */}
                      {PRIZE_IMAGES.map((img, index) => (
                        <img 
                          key={index}
                          src={img}
                          alt={`${settings.prizeName} view ${index + 1}`}
                          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        />
                      ))}
                      
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* SEARCH BOX CONTAINER (DASHBOARD STYLE) */}
            <div className="bg-white text-stone-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8">
                
                <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold flex items-center text-stone-900">
                            <Search className="w-5 h-5 mr-2 text-emerald-600" />
                            {language === 'en' ? 'Check Lucky Number' : 'እድለኛ ቁጥር ይፈልጉ'}
                        </h3>
                        <p className="text-stone-500 text-sm mt-1">
                            {language === 'en' ? 'Search for available numbers in the current cycle.' : 'በዚህ ዙር ያሉትን ክፍት ቁጥሮች ይፈልጉ።'}
                        </p>
                    </div>
                     <div className="flex space-x-4 text-xs font-bold mt-4 md:mt-0 bg-stone-100 p-2 rounded-lg">
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded bg-emerald-500 mr-2"></span>
                            <span className="text-emerald-700">{t.stats.lucky}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded bg-stone-300 mr-2"></span>
                            <span className="text-stone-500">{t.stats.taken}</span>
                        </div>
                    </div>
                </div>

                {/* SEARCH INPUT */}
                <div className="relative mb-6">
                      <input 
                          type="number" 
                          value={luckySearch}
                          onChange={handleLuckySearch}
                          placeholder={language === 'en' ? "Enter lucky number (e.g. 104)" : "እድለኛ ቁጥር ያስገቡ (ለምሳሌ 104)"}
                          className={`w-full pl-5 pr-12 py-4 text-lg border-2 rounded-xl outline-none transition-all ${
                              luckyStatus === 'AVAILABLE' ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-emerald-50/30' :
                              luckyStatus === 'TAKEN' ? 'border-red-300 ring-4 ring-red-200 bg-red-50/30' :
                              'border-stone-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
                          }`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           {luckyStatus === 'AVAILABLE' && <CheckCircle className="w-8 h-8 text-emerald-500 animate-bounce" />}
                           {luckyStatus === 'TAKEN' && <XCircle className="w-8 h-8 text-red-500" />}
                           {luckyStatus === 'IDLE' && <Search className="w-6 h-6 text-stone-300" />}
                      </div>
                </div>

                {/* STATUS MESSAGES */}
                {luckyStatus === 'AVAILABLE' && (
                    <div className="mb-8 animate-fade-in-down">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                             <div className="flex items-center">
                                <CheckCircle className="w-6 h-6 text-emerald-600 mr-3" />
                                <div>
                                    <p className="text-emerald-800 font-bold text-lg">
                                        #{luckySearch} {language === 'en' ? 'is Available!' : 'ክፍት ነው!'}
                                    </p>
                                    <p className="text-emerald-600 text-sm">
                                        {language === 'en' ? 'Register now to secure this number.' : 'ይህንን ቁጥር ለመያዝ አሁኑኑ ይመዝገቡ።'}
                                    </p>
                                </div>
                             </div>
                             <button onClick={() => setView('login')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-500 transition-colors">
                                 {t.hero.cta}
                             </button>
                        </div>
                    </div>
                )}
                
                {luckyStatus === 'TAKEN' && (
                     <div className="mb-8 animate-fade-in-down">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center">
                            <XCircle className="w-6 h-6 text-red-500 mr-3" />
                            <p className="text-red-700 font-bold">
                                #{luckySearch} {language === 'en' ? 'is already taken.' : 'ተይዟል።'}
                            </p>
                        </div>
                    </div>
                )}

                {/* GRID */}
                 <div className="relative">
                     <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">
                        {language === 'en' ? 'Live Availability Board' : 'የእጣ ቁጥሮች ሰሌዳ'}
                     </h4>
                     <div className="relative grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 p-4 bg-stone-50 rounded-xl border border-stone-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {tickets.map((ticket, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                  if (!ticket.isTaken) {
                                      setLuckySearch(ticket.number);
                                      setLuckyStatus('AVAILABLE');
                                  } else {
                                      setLuckySearch(ticket.number);
                                      setLuckyStatus('TAKEN');
                                  }
                              }}
                              className={`
                                aspect-square rounded-lg flex items-center justify-center font-bold text-sm md:text-base border transition-all duration-300 cursor-pointer
                                ${ticket.isTaken 
                                ? 'bg-stone-200 text-stone-400 border-stone-200 cursor-not-allowed' 
                                : 'bg-white text-emerald-600 border-emerald-200 shadow-sm hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:scale-110 hover:shadow-md hover:z-10'}
                                ${luckySearch === ticket.number ? 'ring-4 ring-amber-400 z-20 scale-110' : ''}
                            `}>
                                {ticket.number}
                            </div>
                        ))}
                    </div>
                </div>

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