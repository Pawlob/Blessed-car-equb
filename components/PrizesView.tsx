
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, DollarSign, ChevronRight, Car } from 'lucide-react';
import { Language, AppSettings, ViewState } from '../types';
import { TRANSLATIONS, PRIZE_IMAGES } from '../constants';

interface PrizesViewProps {
  language: Language;
  settings: AppSettings;
  setView: (view: ViewState) => void;
}

const PrizesView: React.FC<PrizesViewProps> = ({ language, settings, setView }) => {
  const t = TRANSLATIONS[language].prizes_page;
  const commonT = TRANSLATIONS[language];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const displayImages = (settings.prizeImages && settings.prizeImages.length > 0) ? settings.prizeImages : PRIZE_IMAGES;

  // Carousel Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <div className="pt-20 pb-12 min-h-screen bg-stone-50">
        {/* Header */}
        <div className="bg-emerald-900 text-white py-16 px-4 mb-12 animate-fade-in-down">
            <div className="max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-800 rounded-full mb-4 shadow-lg">
                    <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.title}</h1>
                <p className="text-xl text-emerald-200 max-w-2xl mx-auto">{t.subtitle}</p>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Current Prize Hero */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-16 border border-stone-200 animate-fade-in-up">
                <div className="grid md:grid-cols-2">
                    <div className="bg-gradient-to-br from-stone-800 to-stone-900 p-8 md:p-12 flex flex-col justify-center text-white relative overflow-hidden">
                        {/* Background pattern */}
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Car className="w-64 h-64" /></div>
                        
                        <div className="relative z-10">
                            <span className="inline-block px-4 py-1 rounded-full bg-amber-500 text-stone-900 font-bold text-sm mb-4 animate-pulse">
                                {t.current_prize}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold mb-2">{settings.prizeName}</h2>
                            <div className="h-1 w-20 bg-emerald-500 mb-6"></div>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-4">
                                        <DollarSign className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-stone-400 text-xs uppercase tracking-wider">{t.value}</p>
                                        <p className="text-xl font-bold">{settings.prizeValue}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mr-4">
                                        <Calendar className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-stone-400 text-xs uppercase tracking-wider">{t.draw_date}</p>
                                        <p className="text-xl font-bold">
                                            {language === 'en' ? settings.nextDrawDateEn : settings.nextDrawDateAm}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setView('login')}
                                className="w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center group"
                            >
                                {commonT.hero.cta} <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    <div className="relative h-64 md:h-auto bg-stone-200 overflow-hidden">
                        {/* Carousel Images */}
                        {displayImages.map((img, index) => (
                            <img 
                                key={index}
                                src={img}
                                alt={`${settings.prizeName} view ${index + 1}`}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                            />
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 to-transparent md:bg-gradient-to-l pointer-events-none"></div>
                    </div>
                </div>
            </div>

            {/* Past Winners Grid */}
            <div className="mb-16 animate-fade-in-up delay-[200ms]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-stone-800">{t.past_winners}</h3>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                    {settings.recentWinners.map((winner) => (
                        <div key={winner.id} className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-xl">
                                    {language === 'en' ? winner.name.charAt(0) : winner.nameAm.charAt(0)}
                                </div>
                                <span className="px-2 py-1 bg-stone-100 text-stone-500 text-xs rounded font-medium">
                                    {language === 'en' ? winner.cycle : winner.cycleAm}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold text-stone-800">{language === 'en' ? winner.name : winner.nameAm}</h4>
                            <p className="text-stone-500 text-sm mb-4">{language === 'en' ? winner.location : winner.locationAm}</p>
                            <div className="pt-4 border-t border-stone-50">
                                <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Won Prize</p>
                                <p className="text-emerald-700 font-bold flex items-center">
                                    <Car className="w-4 h-4 mr-2" /> {language === 'en' ? winner.prize : winner.prizeAm}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Placeholder for layout completeness if needed */}
                    <div className="bg-stone-50 rounded-xl p-6 border border-dashed border-stone-300 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center text-stone-400 mb-4 font-bold text-xl">
                            ?
                        </div>
                        <h4 className="text-lg font-bold text-stone-600 mb-2">{t.cta_title}</h4>
                        <button onClick={() => setView('login')} className="text-emerald-600 font-bold hover:underline text-sm">
                            {t.cta_btn}
                        </button>
                    </div>
                </div>
            </div>

            {/* Upcoming / CTA */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden animate-fade-in-up delay-[400ms]">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy className="w-48 h-48" /></div>
                <div className="relative z-10 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4">{t.cta_title}</h2>
                    {/* Removed Join over... text */}
                    <button 
                        onClick={() => setView('login')}
                        className="px-8 py-3 bg-white text-emerald-900 rounded-full font-bold shadow-lg hover:bg-stone-100 transition-colors transform hover:scale-105"
                    >
                        {t.cta_btn}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
export default PrizesView;
