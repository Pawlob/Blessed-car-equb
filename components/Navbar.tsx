import React, { useState, useEffect } from 'react';
import { Gem, ShieldCheck, Globe, LogOut, Menu, X, User as UserIcon } from 'lucide-react';
import { NavProps } from '../types';
import { TRANSLATIONS } from '../constants';

const Navbar: React.FC<NavProps> = ({ view, setView, language, setLanguage, user, logout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = TRANSLATIONS[language].nav;

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'am' : 'en');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || view === 'dashboard' ? 'bg-emerald-900/95 shadow-lg py-3 backdrop-blur-sm' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={() => setView('landing')}
        >
          <div className="bg-amber-700 p-2 rounded-lg">
            <Gem className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-bold text-white tracking-wide">
            Blessed <span className="text-amber-400">የመኪና ዕቁብ</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {view === 'landing' ? (
            <>
              <a href="#home" className="text-stone-200 hover:text-amber-400 font-medium transition-colors">{t.home}</a>
              <a href="#how-it-works" className="text-stone-200 hover:text-amber-400 font-medium transition-colors">{t.how}</a>
              <a href="#prizes" className="text-stone-200 hover:text-amber-400 font-medium transition-colors">{t.prizes}</a>
            </>
          ) : (
            <span className="text-emerald-200 font-medium flex items-center">
               <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" /> {t.secure}
            </span>
          )}
          
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-stone-200 hover:text-amber-400 transition-colors border border-stone-600 rounded-full px-3 py-1 bg-stone-800/50 hover:bg-stone-700"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-bold">{language === 'en' ? 'EN' : 'አማ'}</span>
          </button>

          {user ? (
             <div className="flex items-center space-x-4">
               <div className="text-right hidden lg:block">
                 <div className="text-white font-bold text-sm">{user.name}</div>
                 <div className="text-emerald-400 text-xs">Member ID: #8291</div>
               </div>
               <button 
                onClick={logout}
                className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded-full font-bold transition-transform shadow-lg border border-stone-700 flex items-center"
               >
                 <LogOut className="w-4 h-4 mr-2" />
                 {t.logout}
               </button>
             </div>
          ) : (
            <button 
              onClick={() => setView('login')}
              className="bg-red-900 hover:bg-red-800 text-white px-6 py-2.5 rounded-full font-bold transition-transform transform hover:scale-105 shadow-lg border border-red-800/50"
            >
              {view === 'login' ? t.home : t.join}
            </button>
          )}
        </div>

        {/* Mobile Menu Controls */}
        <div className="md:hidden flex items-center space-x-4">
          <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-stone-200 border border-stone-600 rounded-full px-3 py-1.5 bg-stone-800/50 active:scale-95 transition-transform"
          >
            <span className="text-xs font-bold">{language === 'en' ? 'EN' : 'አማ'}</span>
          </button>
          
          <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
            {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-emerald-950 absolute w-full border-t border-emerald-800">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {view === 'landing' && (
              <>
                <a onClick={() => setIsOpen(false)} href="#home" className="block px-3 py-3 text-stone-200 hover:bg-emerald-800 rounded-md">{t.home}</a>
                <a onClick={() => setIsOpen(false)} href="#how-it-works" className="block px-3 py-3 text-stone-200 hover:bg-emerald-800 rounded-md">{t.how}</a>
              </>
            )}
            
            {user ? (
               <>
                 <button onClick={() => { setView('dashboard'); setIsOpen(false); }} className="w-full text-left px-3 py-3 text-stone-200 hover:bg-emerald-800 rounded-md flex items-center">
                   <UserIcon className="w-4 h-4 mr-2" />
                   {t.profile}
                 </button>
                 <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-left px-3 py-3 text-red-400 font-bold hover:bg-emerald-800 rounded-md flex items-center">
                   <LogOut className="w-4 h-4 mr-2" />
                   {t.logout}
                 </button>
               </>
            ) : (
              <button 
                onClick={() => { setView('login'); setIsOpen(false); }}
                className="w-full text-left px-3 py-3 text-amber-400 font-bold hover:bg-emerald-800 rounded-md"
              >
                {t.join}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;