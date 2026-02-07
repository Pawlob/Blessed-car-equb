import React from 'react';
import { Trophy, ChevronRight, Play, Car, Users, ShieldCheck } from 'lucide-react';
import Features from './Features';
import SocialProofSection from './SocialProofSection';
import { TRANSLATIONS } from '../constants';
import { Language, ViewState } from '../types';

interface LandingPageProps {
  language: Language;
  setView: (view: ViewState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ language, setView }) => {
  const t = TRANSLATIONS[language];

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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-800/30 border border-emerald-700/50 text-emerald-300 text-sm font-semibold mb-2">
              <Trophy className="w-4 h-4 mr-2 text-amber-400" />
              {t.hero.subtitle} 14 Days
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              {t.hero.title1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">
                {t.hero.title2}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-stone-300 max-w-lg mx-auto md:mx-0 leading-relaxed">
              {t.hero.desc}
            </p>
            
            <div className="flex flex-row items-center space-x-3 justify-center md:justify-start pt-4 w-full sm:w-auto">
              <button 
                onClick={() => setView('login')}
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

          <div className="relative -mt-8 md:mt-0">
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
                        src="https://i.postimg.cc/d1xwLLhj/toyota.avif" 
                        alt="Toyota Corolla Cross" 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                      
                      <div className="absolute inset-0 flex items-end justify-end z-20 p-4">
                          <span className="text-stone-100 font-bold text-sm md:text-base border border-dashed border-stone-500/50 bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-lg shadow-xl transform rotate-[-2deg]">
                              {t.hero.prize_name}
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
                              <p className="text-xl font-bold text-white">ETB 4.5M</p>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-amber-900 text-white py-12 relative z-20 -mt-8 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: t.stats.members, value: "2,150+", icon: Users },
              { label: t.stats.cars, value: "142", icon: Car },
              { label: t.stats.pot, value: "ETB 50M+", icon: Trophy },
              { label: t.stats.trust, value: "100%", icon: ShieldCheck },
            ].map((stat, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="bg-amber-800 p-3 rounded-full mb-3 group-hover:bg-amber-700 transition-colors">
                  <stat.icon className="w-6 h-6 text-amber-200" />
                </div>
                <h4 className="text-3xl font-bold text-white mb-1">{stat.value}</h4>
                <p className="text-amber-200/80 text-sm uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Features language={language} />
      <SocialProofSection language={language} />
      
      <section className="py-16 bg-white text-center">
          <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-emerald-900 mb-6">{t.cta_section.heading}</h2>
              <p className="text-stone-600 mb-8">{t.cta_section.desc}</p>
              <button onClick={() => setView('login')} className="px-10 py-4 bg-red-900 hover:bg-red-800 text-white rounded-full font-bold text-xl shadow-xl transform transition-transform hover:scale-105">
                  {t.cta_section.btn}
              </button>
          </div>
      </section>
    </>
  );
};

export default LandingPage;